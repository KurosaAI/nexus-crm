import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import ClientesClient from "./clientes-client"
import type { Cliente, Profile } from "@/lib/supabase/types"

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, admin_id")
    .eq("id", user.id)
    .single()

  const rol = (profile?.rol ?? "admin") as "admin" | "vendedor"
  const adminId = profile?.admin_id as string | null

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*, vendedor:profiles!vendedor_id(id, nombre), vendedor_original:profiles!vendedor_original_id(id, nombre)")
    .order("created_at", { ascending: false })

  const adminClient = createAdminClient()
  const { data: vendedores } = rol === "admin"
    ? await adminClient.from("profiles").select("id, nombre").eq("rol", "vendedor").eq("admin_id", user.id)
    : await adminClient.from("profiles").select("id, nombre").eq("rol", "vendedor").eq("admin_id", adminId ?? "").neq("id", user.id)

  const solicitudesEntrantes = rol === "vendedor"
    ? (await adminClient
        .from("acciones_clientes")
        .select("id, cliente_id, vendedor_id, justificacion, created_at, cliente:clientes!cliente_id(nombre), solicitante:profiles!vendedor_id(nombre)")
        .eq("destino_id", user.id)
        .eq("tipo", "share")
        .eq("estado", "pendiente")
      ).data ?? []
    : []

  return (
    <ClientesClient
      clientes={(clientes ?? []) as Cliente[]}
      vendedores={(vendedores ?? []) as Pick<Profile, "id" | "nombre">[]}
      rol={rol}
      userId={user.id}
      solicitudesEntrantes={solicitudesEntrantes as any[]}
    />
  )
}
