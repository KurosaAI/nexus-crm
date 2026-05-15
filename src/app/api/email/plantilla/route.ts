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

function construirHTMLEstado(nombre: string, acento: string, icono: string, titulo: string, cuerpo: string, vendedor: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:${acento};padding:36px 40px;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Nexus CRM</p>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">${icono} ${titulo}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#111827;">Hola, ${nombre} 👋</p>
      ${cuerpo}
    </div>
    <div style="padding:20px 40px;border-top:2px solid #f3f4f6;background:#f9fafb;display:flex;align-items:center;justify-content:space-between;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Enviado por <strong style="color:#374151;">${vendedor || "Nexus CRM"}</strong></p>
      <p style="margin:0;font-size:11px;color:#d1d5db;">Nexus CRM</p>
    </div>
  </div>
</body>
</html>`
}

function p(texto: string) {
  return `<p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.8;">${texto}</p>`
}

function caja(texto: string, color: string) {
  return `<div style="background:${color};border-radius:12px;padding:16px 20px;margin:0 0 20px;">${texto}</div>`
}

function construirHTMLManual(cuerpo: string, nombre: string) {
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

const TEMPLATES: Record<string, { acento: string; icono: string; titulo: string; asunto: string; html: (nombre: string, vendedor: string) => string }> = {
  prospecto: {
    acento: "#6366f1",
    icono: "🔍",
    titulo: "Estamos interesados en ti",
    asunto: "Hemos registrado tu perfil en nuestro sistema",
    html: (nombre, vendedor) => construirHTMLEstado(nombre, "#6366f1", "🔍", "Estamos interesados en ti",
      p("Nos complace informarte que hemos registrado tu perfil en nuestro sistema. Estamos explorando cómo podemos ayudarte y en breve nos pondremos en contacto para conocer mejor tus necesidades.") +
      p("Valoramos tu interés y queremos asegurarnos de brindarte la mejor experiencia desde el primer momento.") +
      caja(
        `<p style="margin:0;font-size:13px;color:#4338ca;font-weight:600;">¿Tienes alguna pregunta?</p><p style="margin:4px 0 0;font-size:13px;color:#6366f1;">Tu asesor ${vendedor || "de Nexus CRM"} estará en contacto contigo muy pronto.</p>`,
        "#eef2ff"
      ),
      vendedor
    ),
  },
  contactado: {
    acento: "#0ea5e9",
    icono: "📞",
    titulo: "Hemos iniciado contacto",
    asunto: "Tu asesor está listo para atenderte",
    html: (nombre, vendedor) => construirHTMLEstado(nombre, "#0ea5e9", "📞", "Hemos iniciado contacto",
      p(`Queremos que sepas que${vendedor ? ` <strong>${vendedor}</strong>` : " nuestro equipo"} ya está trabajando en tu caso y estará en contacto contigo muy pronto.`) +
      p("Este es el primer paso hacia una colaboración exitosa. Nuestro compromiso es brindarte la mejor atención posible.") +
      caja(
        `<p style="margin:0;font-size:13px;color:#0369a1;font-weight:600;">Próximo paso</p><p style="margin:4px 0 0;font-size:13px;color:#0ea5e9;">Prepárate para recibir nuestra comunicación en las próximas horas.</p>`,
        "#f0f9ff"
      ),
      vendedor
    ),
  },
  propuesta: {
    acento: "#f59e0b",
    icono: "📋",
    titulo: "Tenemos una propuesta para ti",
    asunto: "Tu propuesta personalizada está lista",
    html: (nombre, vendedor) => construirHTMLEstado(nombre, "#f59e0b", "📋", "Tenemos una propuesta para ti",
      p("Hemos preparado una propuesta personalizada especialmente para ti. Hemos analizado cuidadosamente tus necesidades y creemos tener la solución ideal para alcanzar tus objetivos.") +
      p("Queremos acompañarte en cada paso del proceso y asegurarnos de que esta propuesta supere tus expectativas.") +
      caja(
        `<p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">¿Listo para dar el siguiente paso?</p><p style="margin:4px 0 0;font-size:13px;color:#b45309;">Tu asesor ${vendedor || "de Nexus CRM"} te contactará pronto para revisar los detalles.</p>`,
        "#fffbeb"
      ),
      vendedor
    ),
  },
  cliente: {
    acento: "#10b981",
    icono: "🎉",
    titulo: "¡Bienvenido a la familia!",
    asunto: "¡Bienvenido como cliente oficial!",
    html: (nombre, vendedor) => construirHTMLEstado(nombre, "#10b981", "🎉", "¡Bienvenido a la familia!",
      p("Estamos emocionados de darte la bienvenida como cliente oficial. Este es el comienzo de una relación duradera y exitosa que nos llena de orgullo.") +
      p("A partir de ahora contarás con atención prioritaria y seguimiento personalizado en cada etapa de tu proceso.") +
      caja(
        `<p style="margin:0;font-size:14px;color:#065f46;font-weight:700;">Tu asesor de confianza</p><p style="margin:4px 0 0;font-size:13px;color:#059669;">${vendedor || "Nuestro equipo"} estará disponible para ti en todo momento.</p>`,
        "#ecfdf5"
      ),
      vendedor
    ),
  },
  inactivo: {
    acento: "#64748b",
    icono: "💤",
    titulo: "Te extrañamos",
    asunto: "Ha pasado un tiempo, ¿cómo podemos ayudarte?",
    html: (nombre, vendedor) => construirHTMLEstado(nombre, "#64748b", "💤", "Te extrañamos",
      p("Notamos que ha pasado un tiempo desde nuestro último contacto y queremos asegurarnos de que estés bien.") +
      p("Entendemos que las prioridades cambian, pero nos gustaría retomar la conversación cuando estés listo. Seguimos aquí para ti.") +
      caja(
        `<p style="margin:0;font-size:13px;color:#334155;font-weight:600;">Cuando quieras, aquí estamos</p><p style="margin:4px 0 0;font-size:13px;color:#64748b;">Tu asesor ${vendedor || "de Nexus CRM"} estará encantado de retomar el contacto contigo.</p>`,
        "#f8fafc"
      ),
      vendedor
    ),
  },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { tipo, clienteId, cuerpoPersonalizado, asuntoPersonalizado } = await req.json()

  const adminClient = createAdminClient()

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
  let htmlContent: string

  if (cuerpoPersonalizado) {
    asunto = asuntoPersonalizado || `Mensaje de ${vars.vendedor}`
    htmlContent = construirHTMLManual(reemplazarVariables(cuerpoPersonalizado, vars), vars.nombre)
  } else {
    const adminId = cliente.admin_id
    const { data: plantilla } = await adminClient
      .from("plantillas_email")
      .select("asunto, cuerpo, dias_sin_actividad")
      .eq("admin_id", adminId)
      .eq("tipo", tipo)
      .eq("activa", true)
      .single()

    if (plantilla?.cuerpo) {
      vars.dias = String(plantilla.dias_sin_actividad ?? 7)
      asunto = reemplazarVariables(plantilla.asunto || "Mensaje de Nexus CRM", vars)
      htmlContent = construirHTMLManual(reemplazarVariables(plantilla.cuerpo, vars), vars.nombre)
    } else if (TEMPLATES[tipo]) {
      const tpl = TEMPLATES[tipo]
      asunto = tpl.asunto
      htmlContent = tpl.html(vars.nombre, vars.vendedor)
    } else {
      return NextResponse.json({ ok: true, skipped: true })
    }
  }

  try {
    const brevo = getBrevoClient()
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "Nexus CRM", email: "pruebadeagentes@gmail.com" },
      to: [{ email: cliente.email, name: vars.nombre }],
      subject: asunto,
      htmlContent,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
