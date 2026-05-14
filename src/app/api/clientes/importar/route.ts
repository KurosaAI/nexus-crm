import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const ESTADOS_VALIDOS = ["prospecto", "contactado", "propuesta", "cliente", "inactivo"]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from("profiles")
    .select("rol, admin_id")
    .eq("id", user.id)
    .single()

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 })

  const esAdmin = profile.rol === "admin"
  const adminId = esAdmin ? user.id : profile.admin_id

  if (!adminId) return NextResponse.json({ error: "Sin admin asignado" }, { status: 403 })

  const { filas } = await req.json()
  if (!Array.isArray(filas) || filas.length === 0) {
    return NextResponse.json({ error: "Sin datos para importar" }, { status: 400 })
  }

  const registros = filas
    .filter((f: any) => f.nombre?.trim())
    .map((f: any) => ({
      nombre: f.nombre.trim(),
      email: f.email?.trim() || null,
      telefono: f.telefono?.trim() || null,
      empresa: f.empresa?.trim() || null,
      estado: ESTADOS_VALIDOS.includes(f.estado?.toLowerCase() ?? "") ? f.estado.toLowerCase() : "prospecto",
      admin_id: adminId,
      vendedor_id: esAdmin ? null : user.id,
    }))

  const { error } = await adminClient.from("clientes").insert(registros)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, count: registros.length })
}
