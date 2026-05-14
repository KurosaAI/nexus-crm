import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data, error } = await supabase
      .from("notificaciones")
      .select("id, tipo, mensaje, leida, referencia_id, created_at")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) return NextResponse.json({ notificaciones: [] })
    return NextResponse.json({ notificaciones: data ?? [] })
  } catch {
    return NextResponse.json({ notificaciones: [] })
  }
}

export async function PATCH(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("usuario_id", user.id)
      .eq("leida", false)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
