import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo"

function getBrevoClient() {
  return new BrevoClient({ apiKey: process.env.BREVO_API_KEY!, environment: BrevoEnvironment.Default })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { clienteNombre, clienteEmail, vendedorNombre, empresaNombre } = await req.json()
  if (!clienteEmail) return NextResponse.json({ ok: true }) // sin email, no hay nada que enviar

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user.id)
    .single()

  const remitente = profile?.nombre ?? "El equipo"

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#2563eb;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Nexus CRM</h1>
      <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;font-weight:500;">Bienvenido a nuestro equipo</p>
    </div>
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Hola, ${clienteNombre} 👋</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
        Nos alegra tenerte como cliente${empresaNombre ? ` de <strong style="color:#111827;">${empresaNombre}</strong>` : ""}.
        ${vendedorNombre ? `Tu punto de contacto será <strong style="color:#111827;">${vendedorNombre}</strong>, quien estará disponible para ayudarte.` : `${remitente} estará en contacto contigo pronto.`}
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
          Si tienes alguna pregunta, no dudes en responder a este correo. Estamos aquí para ayudarte.
        </p>
      </div>
      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
        Con gusto,<br/>
        <strong style="color:#374151;">${remitente}</strong>
      </p>
    </div>
    <div style="padding:16px 40px;border-top:1px solid #f3f4f6;background:#f9fafb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Enviado desde Nexus CRM</p>
    </div>
  </div>
</body>
</html>`

  try {
    const brevo = getBrevoClient()
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "Nexus CRM", email: "pruebadeagentes@gmail.com" },
      to: [{ email: clienteEmail, name: clienteNombre }],
      subject: `Bienvenido, ${clienteNombre}`,
      htmlContent: html,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
