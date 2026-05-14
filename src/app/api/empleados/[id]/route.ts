import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from("profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return null
  return user
}

async function distribuirClientes(
  adminClient: ReturnType<typeof createAdminClient>,
  clienteIds: string[],
  empleadoIds: string[],
  temporal: boolean,
  empleadoOriginalId: string
) {
  if (clienteIds.length === 0) return

  if (empleadoIds.length === 0) {
    // Sin empleados activos — dejar sin asignar
    const update: Record<string, any> = { vendedor_id: null }
    if (temporal) update.vendedor_original_id = empleadoOriginalId
    await adminClient.from("clientes").update(update).in("id", clienteIds)
    return
  }

  // Contar clientes actuales de cada empleado destino
  const { data: counts } = await adminClient
    .from("clientes")
    .select("vendedor_id")
    .in("vendedor_id", empleadoIds)

  const countMap: Record<string, number> = {}
  empleadoIds.forEach(id => { countMap[id] = 0 })
  counts?.forEach(c => { if (c.vendedor_id) countMap[c.vendedor_id] = (countMap[c.vendedor_id] || 0) + 1 })

  const empleadosConCount = empleadoIds.map(id => ({ id, count: countMap[id] || 0 }))

  // Asignación equitativa: siempre al que menos tiene
  const grupos: Record<string, string[]> = {}
  for (const clienteId of clienteIds) {
    empleadosConCount.sort((a, b) => a.count - b.count)
    const destino = empleadosConCount[0]
    if (!grupos[destino.id]) grupos[destino.id] = []
    grupos[destino.id].push(clienteId)
    destino.count++
  }

  await Promise.all(
    Object.entries(grupos).map(([vendedorId, ids]) => {
      const update: Record<string, any> = { vendedor_id: vendedorId }
      if (temporal) update.vendedor_original_id = empleadoOriginalId
      else update.vendedor_original_id = null
      return adminClient.from("clientes").update(update).in("id", ids)
    })
  )
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await verificarAdmin()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { estado_empleado } = await req.json()
  const adminClient = createAdminClient()

  // Estado anterior
  const { data: empleado } = await adminClient
    .from("profiles")
    .select("estado_empleado, admin_id")
    .eq("id", id)
    .single()
  const estadoAnterior = empleado?.estado_empleado ?? "activo"

  // Actualizar estado del empleado
  const activo = estado_empleado === "activo"
  const { error } = await adminClient
    .from("profiles")
    .update({ estado_empleado, activo })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Obtener clientes actuales del empleado
  const { data: clientesEmpleado } = await adminClient
    .from("clientes")
    .select("id")
    .eq("vendedor_id", id)

  const clienteIds = (clientesEmpleado ?? []).map(c => c.id)

  // Obtener empleados activos del mismo admin (excluyendo este)
  const { data: empleadosActivos } = await adminClient
    .from("profiles")
    .select("id")
    .eq("admin_id", user.id)
    .eq("rol", "vendedor")
    .eq("estado_empleado", "activo")
    .neq("id", id)

  const empleadoIds = (empleadosActivos ?? []).map(e => e.id)

  if (estado_empleado === "pausado") {
    // Reasignación TEMPORAL — guarda vendedor_original_id
    await distribuirClientes(adminClient, clienteIds, empleadoIds, true, id)

    // Notificar al empleado pausado
    if (clienteIds.length > 0) {
      await adminClient.from("notificaciones").insert({
        usuario_id: id,
        tipo: "pausa",
        mensaje: `Tu cuenta fue pausada. Tus ${clienteIds.length} cliente(s) fueron reasignados temporalmente.`,
        leida: false,
      }).select()
    }

    // Notificar a cada empleado que recibió clientes temporales
    const { data: clientesReasignados } = await adminClient
      .from("clientes")
      .select("vendedor_id")
      .eq("vendedor_original_id", id)

    const receptores = new Set((clientesReasignados ?? []).map(c => c.vendedor_id).filter(Boolean))
    const notifReceptores = Array.from(receptores).map(receptorId => ({
      usuario_id: receptorId as string,
      tipo: "cliente_temporal",
      mensaje: `Se te asignaron clientes temporalmente mientras un compañero está en pausa.`,
      leida: false,
    }))
    if (notifReceptores.length > 0) {
      await adminClient.from("notificaciones").insert(notifReceptores).select()
    }

  } else if (estado_empleado === "inactivo") {
    // Reasignación PERMANENTE — limpia referencias al empleado
    await distribuirClientes(adminClient, clienteIds, empleadoIds, false, id)
    await adminClient.from("clientes").update({ vendedor_original_id: null }).eq("vendedor_original_id", id)
  } else if (estadoAnterior === "pausado") {
    // Salir de pausa hacia cualquier estado (activo, restringido, en_aviso)
    // → devolver clientes originales siempre
    const { data: clientesOriginales } = await adminClient
      .from("clientes")
      .select("id")
      .eq("vendedor_original_id", id)

    const idsOriginales = (clientesOriginales ?? []).map(c => c.id)
    if (idsOriginales.length > 0) {
      await adminClient
        .from("clientes")
        .update({ vendedor_id: id, vendedor_original_id: null })
        .in("id", idsOriginales)
    }

    // Notificar al empleado reactivado que recuperó sus clientes
    if (idsOriginales.length > 0) {
      await adminClient.from("notificaciones").insert({
        usuario_id: id,
        tipo: "reactivacion",
        mensaje: `Tu cuenta fue reactivada. Tus ${idsOriginales.length} cliente(s) te fueron devueltos.`,
        leida: false,
      }).select()
    }
  }
  // restringido, en_aviso (sin venir de pausado) → sin cambio de clientes

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await verificarAdmin()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
