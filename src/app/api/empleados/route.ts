import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from("profiles").select("rol").eq("id", user.id).single()
  if (profile?.rol !== "admin") return NextResponse.json({ error: "Solo el admin puede crear empleados" }, { status: 403 })

  const { nombre, usuario, password, codigoAcceso } = await req.json()
  if (!nombre || !usuario || !password || !codigoAcceso) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
  }
  const email = `${usuario}@nexuscrm.internal`

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // The trigger auto-creates a profile row with rol='admin'. Update it with correct data.
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ nombre, usuario, codigo_acceso: codigoAcceso, rol: "vendedor", activo: true, admin_id: user.id })
    .eq("id", authData.user.id)

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
