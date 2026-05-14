import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import ClienteDetalle from "./cliente-detalle"
import type { Cliente, Nota, HistorialEstado, Profile } from "@/lib/supabase/types"

export default async function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  const [{ data: cliente }, { data: notas }, { data: historial }, { data: vendedores }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*, vendedor:profiles!vendedor_id(id, nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("notas")
      .select("*, autor:profiles!autor_id(nombre)")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("historial_estados")
      .select("*, autor:profiles!autor_id(nombre)")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false }),
    profile?.rol === "admin"
      ? supabase.from("profiles").select("id, nombre").eq("rol", "vendedor")
      : Promise.resolve({ data: [] as Pick<Profile, "id" | "nombre">[] }),
  ])

  if (!cliente) notFound()

  return (
    <ClienteDetalle
      cliente={cliente as Cliente}
      notas={(notas ?? []) as Nota[]}
      historial={(historial ?? []) as HistorialEstado[]}
      vendedores={(vendedores ?? []) as Pick<Profile, "id" | "nombre">[]}
      userId={user.id}
      rol={(profile?.rol ?? "admin") as "admin" | "vendedor"}
    />
  )
}
