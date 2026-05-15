import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo"

function getBrevoClient() {
  return new BrevoClient({ apiKey: process.env.BREVO_API_KEY!, environment: BrevoEnvironment.Default })
}

function reemplazarVariables(texto: string, vars: Record<string, string>) {
  return texto
    .replace(/\[nombre\]/gi, vars.nombre ?? "")
    .replace(/\[vendedor\]/gi, vars.vendedor ?? "")
    .replace(/\[empresa\]/gi, vars.empresa ?? "")
    .replace(/\[estado\]/gi, vars.estado ?? "")
    .replace(/\[dias\]/gi, vars.dias ?? "")
}

function construirHTML(cuerpo: string, nombre: string) {
  const parrafos = cuerpo.split("\n").filter(l => l.trim()).map(l =>
    `<p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">${l}</p>`
  ).join("")

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#2563eb;padding:28px 40px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">Nexus CRM</h1>
      <p style="margin:4px 0 0;color:#bfdbfe;font-size:12px;">Mensaje para ${nombre}</p>
    </div>
    <div style="padding:32px 40px;">${parrafos}</div>
    <div style="padding:16px 40px;border-top:1px solid #f3f4f6;background:#f9fafb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Enviado desde Nexus CRM</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { tipo, clienteId, cuerpoPersonalizado, asuntoPersonalizado } = await req.json()

  const adminClient = createAdminClient()

  // Obtener datos del cliente
  const { data: cliente } = await adminClient
    .from("clientes")
    .select("*, vendedor:profiles!vendedor_id(nombre)")
    .eq("id", clienteId)
    .single()

  if (!cliente?.email) return NextResponse.json({ error: "El cliente no tiene email" }, { status: 400 })

  const vars = {
    nombre: cliente.nombre ?? "",
    vendedor: (cliente.vendedor as any)?.nombre ?? "",
    empresa: cliente.empresa ?? "",
    estado: cliente.estado ?? "",
    dias: "",
  }

  let asunto: string
  let cuerpo: string

  if (cuerpoPersonalizado) {
    // Envío manual del empleado
    asunto = asuntoPersonalizado || `Mensaje de ${vars.vendedor}`
    cuerpo = reemplazarVariables(cuerpoPersonalizado, vars)
  } else {
    // Buscar plantilla guardada del admin
    const adminId = cliente.admin_id
    const { data: plantilla } = await adminClient
      .from("plantillas_email")
      .select("asunto, cuerpo, dias_sin_actividad")
      .eq("admin_id", adminId)
      .eq("tipo", tipo)
      .eq("activa", true)
      .single()

    if (!plantilla?.cuerpo) return NextResponse.json({ ok: true, skipped: true })

    vars.dias = String(plantilla.dias_sin_actividad ?? 7)
    asunto = reemplazarVariables(plantilla.asunto || "Mensaje de Nexus CRM", vars)
    cuerpo = reemplazarVariables(plantilla.cuerpo, vars)
  }

  try {
    const brevo = getBrevoClient()
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "Nexus CRM", email: "pruebadeagentes@gmail.com" },
      to: [{ email: cliente.email, name: vars.nombre }],
      subject: asunto,
      htmlContent: construirHTML(cuerpo, vars.nombre),
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
