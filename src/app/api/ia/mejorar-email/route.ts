import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { texto, tipo, asunto } = await req.json()
  if (!texto?.trim()) return NextResponse.json({ error: "Texto vacío" }, { status: 400 })

  const tipoDescripcion: Record<string, string> = {
    bienvenida: "bienvenida a un nuevo cliente",
    seguimiento: "seguimiento a un cliente que lleva días sin actividad",
    prospecto: "notificación de que el cliente está en etapa de prospecto",
    contactado: "notificación de que el cliente fue contactado",
    propuesta: "notificación de que se le envió una propuesta al cliente",
    cliente: "felicitación porque el prospecto se convirtió en cliente",
    inactivo: "reactivación de un cliente inactivo",
    empleado: "mensaje personalizado de seguimiento de un empleado a su cliente",
  }

  const contexto = tipoDescripcion[tipo] ?? "comunicación con un cliente"

  const prompt = `Eres un experto en redacción de emails de negocios en español.
Tu tarea es mejorar el siguiente mensaje de ${contexto} para que suene más profesional, cálido y persuasivo.

Variables disponibles que se reemplazarán automáticamente con los datos reales:
- [nombre] = nombre del cliente
- [vendedor] = nombre del empleado asignado
- [empresa] = nombre de la empresa del cliente
- [estado] = estado actual del cliente en el pipeline
- [dias] = días sin actividad (solo para seguimiento)

Instrucciones:
- Mantén las variables [entre corchetes] exactamente como están
- El tono debe ser profesional pero cercano
- Máximo 4 párrafos cortos
- No agregues saludos ni despedidas si ya existen en el texto
- Devuelve SOLO el texto mejorado, sin explicaciones ni comentarios
${asunto ? `- El asunto del correo es: "${asunto}"` : ""}

Texto original:
${texto}`

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })
    const mejorado = (message.content[0] as any).text.trim()
    return NextResponse.json({ mejorado })
  } catch (err: any) {
    console.error("ANTHROPIC ERROR:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
