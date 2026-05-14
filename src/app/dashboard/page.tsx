import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import DashboardAdmin from "@/components/dashboard/dashboard-admin"
import DashboardVendedor from "@/components/dashboard/dashboard-vendedor"

function agruparPorPeriodo(fechas: string[], dias: number) {
  const ahora = new Date()
  const resultado: { label: string; clientes: number }[] = []

  if (dias <= 7) {
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(ahora)
      d.setDate(d.getDate() - i)
      const count = fechas.filter(f => {
        const fd = new Date(f)
        return fd.toDateString() === d.toDateString()
      }).length
      resultado.push({ label: d.toLocaleDateString("es-ES", { weekday: "short" }), clientes: count })
    }
  } else if (dias <= 30) {
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(ahora)
      d.setDate(d.getDate() - i)
      const count = fechas.filter(f => {
        const fd = new Date(f)
        return fd.toDateString() === d.toDateString()
      }).length
      if (i % 5 === 0 || i === 0) {
        resultado.push({ label: `${d.getDate()}`, clientes: count })
      }
    }
  } else {
    const meses = dias === 90 ? 3 : 12
    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const siguiente = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1)
      const count = fechas.filter(f => {
        const d = new Date(f)
        return d >= fecha && d < siguiente
      }).length
      resultado.push({ label: fecha.toLocaleDateString("es-ES", { month: "short" }), clientes: count })
    }
  }

  return resultado
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single()

  const rol = profile?.rol ?? "admin"
  const nombre = profile?.nombre || (user.user_metadata?.nombre as string)?.split(" ")[0] || "Usuario"
  const fecha = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })

  if (rol === "vendedor") {
    // Clientes propios
    const { data: misClientes } = await supabase
      .from("clientes")
      .select("id, nombre, empresa, estado, vendedor_original_id")
      .eq("vendedor_id", user.id)

    // Clientes temporalmente reasignados a este vendedor (de otro vendedor pausado)
    const { data: clientesEnPausa } = await supabase
      .from("clientes")
      .select("id, nombre, empresa, estado, vendedor_original_id, perfilOriginal:profiles!vendedor_original_id(nombre)")
      .eq("vendedor_id", user.id)
      .not("vendedor_original_id", "is", null)

    // Clientes en los que este vendedor es colaborador para el cierre
    const { data: clientesColaborando } = await supabase
      .from("clientes")
      .select("id, nombre, empresa, estado, vendedor:profiles!vendedor_id(nombre)")
      .eq("colaborador_id", user.id)

    const totalMisClientes = (misClientes ?? []).length
    const contactadosHoy = (misClientes ?? []).filter(c => c.estado === "contactado").length
    const propuestas = (misClientes ?? []).filter(c => c.estado === "propuesta").length
    const cierres = (misClientes ?? []).filter(c => c.estado === "cliente").length

    return (
      <DashboardVendedor
        nombre={nombre}
        fecha={fecha}
        metricas={{ totalMisClientes, contactadosHoy, propuestas, cierres }}
        clientesEnPausa={(clientesEnPausa ?? []) as any[]}
        clientesColaborando={(clientesColaborando ?? []) as any[]}
      />
    )
  }

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, created_at, estado")
    .eq("admin_id", user.id)

  const todos = clientes ?? []
  const fechas = todos.map(c => c.created_at)

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0)

  const total = todos.length
  const inactivos = todos.filter(c => c.estado === "inactivo").length
  const activos = total - inactivos
  const nuevosEsteMes = todos.filter(c => new Date(c.created_at) >= inicioMes).length
  const nuevosMesAnterior = todos.filter(c => {
    const d = new Date(c.created_at)
    return d >= inicioMesAnterior && d <= finMesAnterior
  }).length

  function calcCambio(actual: number, anterior: number) {
    if (anterior === 0) return actual > 0 ? "+100%" : "0%"
    const pct = Math.round(((actual - anterior) / anterior) * 100)
    return `${pct >= 0 ? "+" : ""}${pct}%`
  }

  const estadoCounts: Record<string, number> = {}
  todos.forEach(c => { estadoCounts[c.estado] = (estadoCounts[c.estado] || 0) + 1 })

  const datosPorPeriodo = {
    "7D": agruparPorPeriodo(fechas, 7),
    "30D": agruparPorPeriodo(fechas, 30),
    "3M": agruparPorPeriodo(fechas, 90),
    "12M": agruparPorPeriodo(fechas, 365),
  }

  const adminClient = createAdminClient()
  const clienteIds = todos.map(c => c.id)
  const [{ data: notasRecientes }, { data: accionesPendientes }] = await Promise.all([
    clienteIds.length > 0
      ? supabase
          .from("notas")
          .select("contenido, created_at, autor:profiles!autor_id(nombre), cliente:clientes!cliente_id(nombre)")
          .in("cliente_id", clienteIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    clienteIds.length > 0
      ? adminClient
          .from("acciones_clientes")
          .select("id, tipo, justificacion, estado, created_at, vendedor:profiles!vendedor_id(nombre), cliente:clientes!cliente_id(nombre), destino:profiles!destino_id(nombre)")
          .in("cliente_id", clienteIds)
          .eq("estado", "pendiente")
          .neq("tipo", "share")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  return (
    <DashboardAdmin
      nombre={nombre}
      fecha={fecha}
      kpis={{
        total,
        activos,
        inactivos,
        nuevosEsteMes,
        cambioTotal: calcCambio(total, todos.filter(c => new Date(c.created_at) < inicioMes).length > 0 ? todos.filter(c => new Date(c.created_at) < inicioMes).length : 0),
        cambioActivos: calcCambio(activos, activos),
        cambioNuevos: calcCambio(nuevosEsteMes, nuevosMesAnterior),
        cambioInactivos: calcCambio(inactivos, inactivos),
      }}
      estadoCounts={estadoCounts}
      datosPorPeriodo={datosPorPeriodo}
      actividadReciente={(notasRecientes ?? []) as any[]}
      accionesPendientes={(accionesPendientes ?? []) as any[]}
    />
  )
}
