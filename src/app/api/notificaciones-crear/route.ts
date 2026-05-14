import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { usuario_id, tipo, mensaje, referencia_id } = body

    if (!usuario_id || !mensaje) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
    }

    const { error } = await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: tipo ?? "general",
      mensaje,
      referencia_id: referencia_id ?? null,
      leida: false,
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error al crear notificación" }, { status: 500 })
  }
}
