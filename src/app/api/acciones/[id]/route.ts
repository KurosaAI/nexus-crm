import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id } = await params
    const { decision, motivo_rechazo } = await req.json()

    if (!["aprobada", "rechazada"].includes(decision)) {
      return NextResponse.json({ error: "Decisión inválida" }, { status: 400 })
    }

    const { data: accion, error: fetchError } = await adminClient
      .from("acciones_clientes")
      .select("*, cliente:clientes!cliente_id(nombre, admin_id, vendedor_id)")
      .eq("id", id)
      .single()

    if (fetchError || !accion) return NextResponse.json({ error: "Acción no encontrada" }, { status: 404 })

    const esCompaneroRespondiendo = accion.tipo === "share" && accion.destino_id === user.id
    const esAdminRespondiendo = (accion.cliente as any)?.admin_id === user.id

    if (!esCompaneroRespondiendo && !esAdminRespondiendo) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Actualizar estado de la acción
    await adminClient
      .from("acciones_clientes")
      .update({ estado: decision, motivo_rechazo: motivo_rechazo ?? null, updated_at: new Date().toISOString() })
      .eq("id", id)

    // Ejecutar la acción si se aprueba
    if (decision === "aprobada") {
      if (accion.tipo === "share") {
        await adminClient.from("clientes").update({ colaborador_id: user.id }).eq("id", accion.cliente_id)
      } else if (accion.tipo === "transfer" && accion.destino_id) {
        await adminClient.from("clientes").update({ vendedor_id: accion.destino_id }).eq("id", accion.cliente_id)
      } else if (accion.tipo === "liberar") {
        await adminClient.from("clientes").update({ vendedor_id: null }).eq("id", accion.cliente_id)
      }
    }

    const clienteNombre = (accion.cliente as any)?.nombre ?? "cliente"

    // Notificar al solicitante original
    if (accion.vendedor_id) {
      const mensajes: Record<string, Record<string, string>> = {
        aprobada: {
          share:    `✅ Tu compañero aceptó colaborar en el cierre de "${clienteNombre}".`,
          transfer: `✅ Tu solicitud de transferir "${clienteNombre}" fue aprobada.`,
          liberar:  `✅ Tu solicitud de liberar "${clienteNombre}" fue aprobada.`,
        },
        rechazada: {
          share:    `❌ Tu compañero rechazó la solicitud de colaborar en "${clienteNombre}".`,
          transfer: `❌ Tu solicitud de transferir "${clienteNombre}" fue rechazada.`,
          liberar:  `❌ Tu solicitud de liberar "${clienteNombre}" fue rechazada.`,
        },
      }
      const mensajeVendedor = mensajes[decision]?.[accion.tipo]
      if (mensajeVendedor) {
        await adminClient.from("notificaciones").insert({
          usuario_id: accion.vendedor_id,
          tipo: "respuesta_accion",
          mensaje: motivo_rechazo ? `${mensajeVendedor} Motivo: ${motivo_rechazo}` : mensajeVendedor,
          referencia_id: accion.cliente_id,
          leida: false,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 })
  }
}
