import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import SolicitudesClient from "./solicitudes-client"

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  if (profile?.rol !== "admin") redirect("/dashboard")

  const adminClient = createAdminClient()

  const { data: clientesAdmin } = await supabase
    .from("clientes")
    .select("id")
    .eq("admin_id", user.id)

  const ids = (clientesAdmin ?? []).map((c: any) => c.id)

  let pendientes: any[] = []
  let historial: any[] = []

  if (ids.length > 0) {
    const [{ data: p }, { data: h }] = await Promise.all([
      adminClient
        .from("acciones_clientes")
        .select("id, tipo, justificacion, estado, created_at, vendedor:profiles!vendedor_id(nombre), cliente:clientes!cliente_id(nombre), destino:profiles!destino_id(nombre)")
        .in("cliente_id", ids)
        .eq("estado", "pendiente")
        .neq("tipo", "share")
        .order("created_at", { ascending: false }),
      adminClient
        .from("acciones_clientes")
        .select("id, tipo, justificacion, estado, motivo_rechazo, created_at, updated_at, vendedor:profiles!vendedor_id(nombre), cliente:clientes!cliente_id(nombre), destino:profiles!destino_id(nombre)")
        .in("cliente_id", ids)
        .in("estado", ["aprobada", "rechazada"])
        .neq("tipo", "share")
        .order("updated_at", { ascending: false })
        .limit(20),
    ])
    pendientes = p ?? []
    historial = h ?? []
  }

  return <SolicitudesClient pendientes={pendientes} historial={historial} />
}
