"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Link from "next/link"
import { ArrowLeft, Trash2, MessageSquare, Clock, User, Building2, Mail, Phone, FileDown, Send, Sparkles } from "lucide-react"
import { useLanguage } from "@/i18n/context"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, Nota, HistorialEstado, EstadoCliente } from "@/lib/supabase/types"
import { ESTADO_COLORS, ESTADO_KEYS } from "@/lib/supabase/types"

interface Props {
  cliente: Cliente
  notas: Nota[]
  historial: HistorialEstado[]
  vendedores: { id: string; nombre: string }[]
  userId: string
  rol: "admin" | "vendedor"
}

export default function ClienteDetalle({ cliente, notas: notasIniciales, historial: historialInicial, vendedores, userId, rol }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [estadoActual, setEstadoActual] = useState<EstadoCliente>(cliente.estado as EstadoCliente)
  const [vendedorId, setVendedorId] = useState<string>((cliente.vendedor as any)?.id ?? "")
  const [notas, setNotas] = useState<Nota[]>(notasIniciales)
  const [historial, setHistorial] = useState<HistorialEstado[]>(historialInicial)
  const [nuevaNota, setNuevaNota] = useState("")
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [mensajeEmail, setMensajeEmail] = useState("")
  const [asuntoEmail, setAsuntoEmail] = useState("")
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [mejorando, setMejorando] = useState(false)
  const [mostrarEnvioEmail, setMostrarEnvioEmail] = useState(false)

  const estadoLabel: Record<string, string> = {
    prospecto: t.cl.prospect,
    contactado: t.cl.contacted,
    propuesta: t.cl.proposal,
    cliente: t.cl.client,
    inactivo: t.cl.inactive,
  }

  async function cambiarEstado(nuevoEstado: EstadoCliente) {
    if (nuevoEstado === estadoActual) return
    const anterior = estadoActual
    setEstadoActual(nuevoEstado)
    await supabase.from("clientes").update({ estado: nuevoEstado }).eq("id", cliente.id)
    const { data: nuevaEntrada } = await supabase
      .from("historial_estados")
      .insert({ cliente_id: cliente.id, estado_anterior: anterior, estado_nuevo: nuevoEstado, autor_id: userId })
      .select("*, autor:profiles!autor_id(nombre)")
      .single()
    if (nuevaEntrada) setHistorial(h => [nuevaEntrada as HistorialEstado, ...h])
    toast.success(t.cd.statusUpdated)
    if (cliente.email) {
      fetch("/api/email/plantilla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: nuevoEstado, clienteId: cliente.id }),
      })
    }
  }

  async function agregarNota() {
    if (!nuevaNota.trim()) return
    setGuardandoNota(true)
    const { data } = await supabase
      .from("notas")
      .insert({ cliente_id: cliente.id, autor_id: userId, contenido: nuevaNota.trim() })
      .select("*, autor:profiles!autor_id(nombre)")
      .single()
    if (data) {
      setNotas(n => [data as Nota, ...n])
      setNuevaNota("")
      toast.success(t.cd.notesSaved)
    }
    setGuardandoNota(false)
  }

  async function eliminarCliente() {
    setEliminando(true)
    await supabase.from("clientes").delete().eq("id", cliente.id)
    toast.success(t.cl.clientDeleted)
    router.push("/dashboard/clientes")
  }

  async function mejorarMensajeConIA() {
    if (!mensajeEmail.trim()) { toast.error(t.cd.writeFirst); return }
    setMejorando(true)
    const res = await fetch("/api/ia/mejorar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: mensajeEmail, tipo: "empleado", asunto: asuntoEmail }),
    })
    const data = await res.json()
    if (data.mejorado) { setMensajeEmail(data.mejorado); toast.success(t.cd.improvedOk) }
    else toast.error(t.cd.improvedErr)
    setMejorando(false)
  }

  async function enviarEmailManual() {
    if (!mensajeEmail.trim() || !asuntoEmail.trim()) { toast.error(t.cd.subjectAndBodyRequired); return }
    if (!cliente.email) { toast.error(t.cd.noEmailClient); return }
    setEnviandoEmail(true)
    const res = await fetch("/api/email/plantilla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "empleado", clienteId: cliente.id, cuerpoPersonalizado: mensajeEmail, asuntoPersonalizado: asuntoEmail }),
    })
    if (res.ok) {
      toast.success(`${t.cd.emailSent} ${cliente.email}`)
      setMensajeEmail("")
      setAsuntoEmail("")
      setMostrarEnvioEmail(false)
    } else {
      toast.error(t.cd.emailError)
    }
    setEnviandoEmail(false)
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  async function generarPDF() {
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF
    const doc = new jsPDF()
    const margin = 20
    let y = margin

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, 210, 30, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Ficha de Cliente", margin, 19)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Nexus CRM · ${new Date().toLocaleDateString()}`, 210 - margin, 19, { align: "right" })

    y = 45
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(cliente.nombre, margin, y)

    y += 6
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const estadoTexto = { prospecto: "Prospecto", contactado: "Contactado", propuesta: "Propuesta enviada", cliente: "Cliente", inactivo: "Inactivo" }[estadoActual] ?? estadoActual
    doc.text(`Estado: ${estadoTexto}`, margin, y)

    y += 12
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, y, 210 - margin, y)
    y += 8

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Información de contacto", margin, y)
    y += 7

    const campos = [
      ["Empresa", cliente.empresa],
      ["Email", cliente.email],
      ["Teléfono", cliente.telefono],
      ["Vendedor", (cliente.vendedor as any)?.nombre],
      ["Registrado", formatFecha(cliente.created_at)],
    ].filter(([, v]) => v) as [string, string][]

    doc.setFontSize(10)
    for (const [label, valor] of campos) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(80, 80, 80)
      doc.text(`${label}:`, margin, y)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(valor, margin + 35, y)
      y += 6
    }

    if (notas.length > 0) {
      y += 6
      doc.line(margin, y, 210 - margin, y)
      y += 8
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text(`Notas (${notas.length})`, margin, y)
      y += 7
      doc.setFontSize(9)
      for (const nota of notas.slice(0, 8)) {
        doc.setFont("helvetica", "bold")
        doc.setTextColor(80, 80, 80)
        doc.text(`${(nota.autor as any)?.nombre ?? "—"} · ${formatFecha(nota.created_at)}`, margin, y)
        y += 4
        doc.setFont("helvetica", "normal")
        doc.setTextColor(0, 0, 0)
        const lineas = doc.splitTextToSize(nota.contenido, 170)
        doc.text(lineas, margin, y)
        y += lineas.length * 4.5 + 3
        if (y > 270) break
      }
    }

    doc.save(`${cliente.nombre.replace(/\s+/g, "_")}_ficha.pdf`)
    toast.success(t.cd.pdfGenerated)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clientes"
            className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-black dark:text-white hover:border-blue-400 hover:text-blue-600 transition flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">{cliente.nombre}</h1>
            <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">
              {t.cd.registered} {formatFecha(cliente.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={generarPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition">
            <FileDown size={14} />PDF
          </button>
          {rol === "admin" && (
            <button onClick={() => setConfirmEliminar(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition">
              <Trash2 size={14} />{t.cd.deleteClient}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info + estado */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-black dark:text-white mb-4">{t.cd.info}</h2>
            <div className="space-y-3">
              {cliente.empresa && (
                <div className="flex items-center gap-2.5">
                  <Building2 size={14} className="text-black/30 dark:text-white/30 flex-shrink-0" />
                  <span className="text-sm font-semibold text-black dark:text-white">{cliente.empresa}</span>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-black/30 dark:text-white/30 flex-shrink-0" />
                  <span className="text-sm font-semibold text-black dark:text-white">{cliente.email}</span>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-black/30 dark:text-white/30 flex-shrink-0" />
                  <span className="text-sm font-semibold text-black dark:text-white">{cliente.telefono}</span>
                </div>
              )}
              {rol === "admin" && (
                <div className="flex items-start gap-2.5">
                  <User size={14} className="text-black/30 flex-shrink-0 mt-2.5" />
                  <div className="flex-1">
                    <label className="block text-xs font-black text-black/40 dark:text-white/40 mb-1">{t.cd.seller}</label>
                    <select
                      value={vendedorId}
                      onChange={async e => {
                        const nuevoId = e.target.value
                        setVendedorId(nuevoId)
                        await supabase.from("clientes").update({ vendedor_id: nuevoId || null }).eq("id", cliente.id)
                        const nombre = vendedores.find(v => v.id === nuevoId)?.nombre
                        toast.success(nombre ? `${t.cl.assigned} ${nombre}` : t.cl.unassigned2)
                      }}
                      className="w-full text-sm font-semibold px-3 py-1.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white bg-white dark:bg-gray-700 transition"
                    >
                      <option value="">{t.cd.unassigned}</option>
                      {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {rol !== "admin" && (cliente.vendedor as any)?.nombre && (
                <div className="flex items-center gap-2.5">
                  <User size={14} className="text-black/30 flex-shrink-0" />
                  <span className="text-sm font-semibold text-black">{(cliente.vendedor as any).nombre}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-black dark:text-white mb-3">{t.cd.status}</h2>
            <div className="space-y-2">
              {ESTADO_KEYS.map(k => (
                <button key={k} onClick={() => cambiarEstado(k)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border-2 transition ${
                    estadoActual === k
                      ? ESTADO_COLORS[k] + " shadow-sm"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-black/40 dark:text-white/40 hover:border-blue-300 hover:text-black dark:hover:text-white"
                  }`}>
                  {estadoLabel[k]}
                  {estadoActual === k && <span className="float-right">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notas + Historial */}
        <div className="lg:col-span-2 space-y-4">

          {/* Enviar email manual */}
          {cliente.email && (
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setMostrarEnvioEmail(!mostrarEnvioEmail)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
              >
                <span className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <Send size={14} className="text-blue-600" />
                  {t.cd.sendEmailTo} {cliente.nombre}
                </span>
                <span className="text-xs font-semibold text-black/40 dark:text-white/40">{mostrarEnvioEmail ? t.cd.closePanel : t.cd.openPanel}</span>
              </button>
              {mostrarEnvioEmail && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t-2 border-gray-100 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder={t.cd.emailSubjectPlaceholder}
                    value={asuntoEmail}
                    onChange={e => setAsuntoEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
                  />
                  <textarea
                    rows={4}
                    placeholder={t.cd.emailBodyPlaceholder}
                    value={mensajeEmail}
                    onChange={e => setMensajeEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={mejorarMensajeConIA} disabled={mejorando}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-300 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 disabled:opacity-50 transition">
                      <Sparkles size={12} />
                      {mejorando ? t.cd.improving : t.cd.improveWithAI}
                    </button>
                    <button onClick={enviarEmailManual} disabled={enviandoEmail}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold border-2 border-blue-700 transition shadow-md">
                      <Send size={12} />
                      {enviandoEmail ? t.cd.sending : t.cd.send}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agregar nota */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-black dark:text-white mb-3 flex items-center gap-2">
              <MessageSquare size={14} />{t.cd.addNote}
            </h2>
            <textarea rows={3} value={nuevaNota} onChange={e => setNuevaNota(e.target.value)}
              placeholder={t.cd.notePlaceholder}
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition resize-none" />
            <button onClick={agregarNota} disabled={guardandoNota || !nuevaNota.trim()}
              className="mt-3 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold border-2 border-blue-700 transition shadow-md">
              {guardandoNota ? t.cd.saving : t.cd.saveNote}
            </button>
          </div>

          {/* Lista de notas */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-black dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={14} /> {t.cd.notes} <span className="text-black/30 dark:text-white/30 font-medium">({notas.length})</span>
            </h2>
            {notas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                <p className="text-black/30 dark:text-white/30 text-xs font-semibold">{t.cd.noNotes}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notas.map(n => (
                  <div key={n.id} className="border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3">
                    <p className="text-sm font-medium text-black dark:text-white leading-relaxed">{n.contenido}</p>
                    <p className="text-xs text-black/30 dark:text-white/30 font-semibold mt-1.5">
                      {(n.autor as any)?.nombre ?? "—"} · {formatFecha(n.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de estados */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-black dark:text-white mb-4 flex items-center gap-2">
              <Clock size={14} /> {t.cd.history} <span className="text-black/30 dark:text-white/30 font-medium">({historial.length})</span>
            </h2>
            {historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                <p className="text-black/30 dark:text-white/30 text-xs font-semibold">{t.cd.noHistory}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historial.map(h => (
                  <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                    <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black dark:text-white">
                        {h.estado_anterior && (
                          <span className="text-black/40 dark:text-white/40">{estadoLabel[h.estado_anterior] ?? h.estado_anterior} → </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-md border ${ESTADO_COLORS[h.estado_nuevo as EstadoCliente] ?? "bg-gray-100 border-gray-200 text-black/60"}`}>
                          {estadoLabel[h.estado_nuevo] ?? h.estado_nuevo}
                        </span>
                      </p>
                      <p className="text-xs text-black/30 dark:text-white/30 font-medium mt-0.5">
                        {(h.autor as any)?.nombre ?? "—"} · {formatFecha(h.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-red-200 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-black dark:text-white mb-1">{t.cd.deleteClient}</h3>
            <p className="text-black/50 dark:text-white/50 text-xs font-medium mb-4">{t.cd.confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition">
                {t.cd.cancel}
              </button>
              <button onClick={eliminarCliente} disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold border-2 border-red-600 transition">
                {eliminando ? "..." : t.cd.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
