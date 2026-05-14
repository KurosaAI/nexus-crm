import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await req.json()
    const { cliente_id, tipo, justificacion, destino_id, estado } = body

    if (!cliente_id || !tipo) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
    }

    const { error: insertError } = await adminClient.from("acciones_clientes").insert({
      cliente_id,
      vendedor_id: user.id,
      tipo,
      justificacion: justificacion ?? null,
      destino_id: destino_id ?? null,
      estado: estado ?? "pendiente",
    })

    if (insertError) throw insertError

    const [{ data: cliente }, { data: vendedor }] = await Promise.all([
      adminClient.from("clientes").select("nombre, admin_id").eq("id", cliente_id).single(),
      adminClient.from("profiles").select("nombre").eq("id", user.id).single(),
    ])

    const nota = justificacion ? ` Nota: "${justificacion}"` : ""

    if (tipo === "share" && destino_id) {
      await adminClient.from("notificaciones").insert({
        usuario_id: destino_id,
        tipo: "solicitud_compartir",
        mensaje: `${vendedor?.nombre} te invita a colaborar en el cierre del cliente "${cliente?.nombre}". Revisa tus solicitudes en la página de Clientes.${nota}`,
        referencia_id: cliente_id,
        leida: false,
      })
    }

    if (cliente?.admin_id && tipo !== "share") {
      const mensajes: Record<string, string> = {
        transfer:  `${vendedor?.nombre} solicita transferir al cliente "${cliente.nombre}" a otro vendedor.${nota}`,
        liberar:   `${vendedor?.nombre} solicita liberar al cliente "${cliente.nombre}".${nota}`,
        escalate:  `⚠️ ${vendedor?.nombre} escaló al cliente "${cliente.nombre}" — requiere tu atención urgente.${nota}`,
        help:      `${vendedor?.nombre} solicitó ayuda de un compañero para el cliente "${cliente.nombre}".${nota}`,
        conflict:  `🚨 ${vendedor?.nombre} marcó un conflicto con el cliente "${cliente.nombre}".${nota}`,
      }
      await adminClient.from("notificaciones").insert({
        usuario_id: cliente.admin_id,
        tipo: "accion_vendedor",
        mensaje: mensajes[tipo] ?? `Nueva acción de ${vendedor?.nombre} sobre "${cliente.nombre}".${nota}`,
        referencia_id: cliente_id,
        leida: false,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[acciones] catch error:", e)
    return NextResponse.json({ error: "Error al registrar la acción" }, { status: 500 })
  }
}
