import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import DashboardShell from "@/components/layout/dashboard-shell"
import { Toaster } from "react-hot-toast"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  const rol = profile?.rol ?? "admin"

  let solicitudesPendientes = 0
  if (rol === "admin") {
    const adminClient = createAdminClient()
    const { data: clientesAdmin } = await supabase.from("clientes").select("id").eq("admin_id", user.id)
    const ids = (clientesAdmin ?? []).map((c: any) => c.id)
    if (ids.length > 0) {
      const { count } = await adminClient
        .from("acciones_clientes")
        .select("id", { count: "exact", head: true })
        .in("cliente_id", ids)
        .eq("estado", "pendiente")
        .neq("tipo", "share")
      solicitudesPendientes = count ?? 0
    }
  }

  return (
    <>
      <DashboardShell user={user} rol={rol} solicitudesPendientes={solicitudesPendientes}>
        {children}
      </DashboardShell>
      <Toaster position="bottom-right" toastOptions={{ style: { fontWeight: 600, fontSize: "13px" } }} />
    </>
  )
}
