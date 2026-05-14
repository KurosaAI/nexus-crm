"use client"

import { useState } from "react"
import { ClipboardList, CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, User, ArrowRight, Unlock, History } from "lucide-react"
import toast from "react-hot-toast"

interface Accion {
  id: string
  tipo: string
  justificacion: string | null
  estado: string
  motivo_rechazo?: string | null
  created_at: string
  updated_at?: string
  vendedor: { nombre: string } | null
  cliente: { nombre: string } | null
  destino: { nombre: string } | null
}

interface Props {
  pendientes: Accion[]
  historial: Accion[]
}

const TIPO_LABEL: Record<string, string> = {
  transfer: "Transferir cliente",
  liberar: "Liberar cliente",
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  transfer: <ArrowRight size={13} />,
  liberar: <Unlock size={13} />,
}

const TIPO_COLOR: Record<string, string> = {
  transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  liberar: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function SolicitudesClient({ pendientes: init, historial }: Props) {
  const [pendientes, setPendientes] = useState<Accion[]>(init)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<"pendientes" | "historial">("pendientes")

  function toggleExpandir(id: string) {
    setExpandidos(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function decidir(id: string, decision: "aprobada" | "rechazada") {
    setProcesando(id)
    try {
      const res = await fetch(`/api/acciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, motivo_rechazo: motivo || null }),
      })
      if (!res.ok) throw new Error()
      setPendientes(prev => prev.filter(a => a.id !== id))
      setRechazando(null)
      setMotivo("")
      toast.success(decision === "aprobada" ? "Acción aprobada" : "Acción rechazada")
    } catch {
      toast.error("Error al procesar")
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Administrar solicitudes</h1>
        <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">
          Aprueba o rechaza las acciones enviadas por tus vendedores
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("pendientes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
            tab === "pendientes"
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white dark:bg-gray-800 text-black dark:text-white border-gray-200 dark:border-gray-700 hover:border-blue-300"
          }`}
        >
          <Clock size={14} />
          Pendientes
          {pendientes.length > 0 && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              tab === "pendientes" ? "bg-white text-blue-600" : "bg-red-500 text-white"
            }`}>
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("historial")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
            tab === "historial"
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white dark:bg-gray-800 text-black dark:text-white border-gray-200 dark:border-gray-700 hover:border-blue-300"
          }`}
        >
          <History size={14} />
          Historial
        </button>
      </div>

      {/* Pendientes */}
      {tab === "pendientes" && (
        <div className="space-y-3">
          {pendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
              <CheckCircle2 size={32} className="text-green-400 mb-3" />
              <p className="text-black dark:text-white font-bold">Todo al día</p>
              <p className="text-black/40 dark:text-white/40 text-sm font-medium mt-1">No hay solicitudes pendientes</p>
            </div>
          ) : (
            pendientes.map(accion => {
              const expandido = expandidos.has(accion.id)
              const esteRechazando = rechazando === accion.id
              return (
                <div key={accion.id} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Tipo badge */}
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${TIPO_COLOR[accion.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                        {TIPO_ICON[accion.tipo]}
                        {TIPO_LABEL[accion.tipo] ?? accion.tipo}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-black dark:text-white">{accion.cliente?.nombre ?? "—"}</span>
                          <span className="text-black/30 dark:text-white/30 text-xs">·</span>
                          <span className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 font-medium">
                            <User size={11} />
                            {accion.vendedor?.nombre ?? "—"}
                          </span>
                          {accion.destino && (
                            <>
                              <span className="text-black/30 dark:text-white/30 text-xs">→</span>
                              <span className="text-xs text-black/50 dark:text-white/50 font-medium">{accion.destino.nombre}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-black/30 dark:text-white/30 font-medium mt-0.5">{formatFecha(accion.created_at)}</p>
                      </div>

                      {accion.justificacion && (
                        <button
                          onClick={() => toggleExpandir(accion.id)}
                          className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                        >
                          {expandido ? <><ChevronUp size={13} />Ocultar</> : <><ChevronDown size={13} />Justificación</>}
                        </button>
                      )}
                    </div>

                    {expandido && accion.justificacion && (
                      <div className="mt-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-black/70 dark:text-white/70 font-medium leading-relaxed">{accion.justificacion}</p>
                      </div>
                    )}

                    {/* Botones o formulario de rechazo */}
                    {!esteRechazando ? (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => decidir(accion.id, "aprobada")}
                          disabled={procesando === accion.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold border-2 border-green-600 transition disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          {procesando === accion.id ? "Procesando..." : "Aprobar"}
                        </button>
                        <button
                          onClick={() => { setRechazando(accion.id); setMotivo("") }}
                          disabled={procesando === accion.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold border-2 border-red-600 transition disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={motivo}
                          onChange={e => setMotivo(e.target.value)}
                          placeholder="Motivo del rechazo (opcional)..."
                          rows={2}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-red-400 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 resize-none font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decidir(accion.id, "rechazada")}
                            disabled={procesando === accion.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold border-2 border-red-600 transition disabled:opacity-50"
                          >
                            <XCircle size={13} />
                            {procesando === accion.id ? "Procesando..." : "Confirmar rechazo"}
                          </button>
                          <button
                            onClick={() => { setRechazando(null); setMotivo("") }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-black/50 dark:text-white/50 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Historial */}
      {tab === "historial" && (
        <div className="space-y-3">
          {historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
              <History size={32} className="text-gray-300 mb-3" />
              <p className="text-black/40 dark:text-white/40 text-sm font-medium">Sin historial aún</p>
            </div>
          ) : (
            historial.map(accion => (
              <div key={accion.id} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${TIPO_COLOR[accion.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                    {TIPO_ICON[accion.tipo]}
                    {TIPO_LABEL[accion.tipo] ?? accion.tipo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-black dark:text-white">{accion.cliente?.nombre ?? "—"}</span>
                      <span className="text-black/30 text-xs">·</span>
                      <span className="text-xs text-black/50 dark:text-white/50 font-medium">{accion.vendedor?.nombre ?? "—"}</span>
                    </div>
                    {accion.motivo_rechazo && (
                      <p className="text-xs text-red-500 font-medium mt-0.5">Motivo: {accion.motivo_rechazo}</p>
                    )}
                    <p className="text-xs text-black/30 dark:text-white/30 font-medium mt-0.5">{formatFecha(accion.updated_at ?? accion.created_at)}</p>
                  </div>
                  <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                    accion.estado === "aprobada"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {accion.estado === "aprobada" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {accion.estado === "aprobada" ? "Aprobada" : "Rechazada"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
