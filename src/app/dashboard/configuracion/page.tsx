import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SettingsForm from "./settings-form"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single()

  const nombre = profile?.nombre || (user.user_metadata?.nombre as string) || ""
  const email = user.email || ""
  const rol = (profile?.rol ?? "admin") as "admin" | "vendedor"

  const { data: plantillas } = rol === "admin"
    ? await supabase.from("plantillas_email").select("*").eq("admin_id", user.id)
    : { data: [] }

  return <SettingsForm nombre={nombre} email={email} rol={rol} plantillas={plantillas ?? []} />
}
