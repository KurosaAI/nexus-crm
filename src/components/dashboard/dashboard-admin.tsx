"use client"

import { useState } from "react"
import { Users, UserCheck, TrendingUp, UserX, ArrowUpRight, ArrowDownRight, Clock, MessageSquare, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import GraficaLinea from "@/components/dashboard/grafica-linea"
import GraficaDona from "@/components/dashboard/grafica-dona"
import { useLanguage } from "@/i18n/context"
import toast from "react-hot-toast"

interface Nota {
  contenido: string
  created_at: string
  autor: { nombre: string } | null
  cliente: { nombre: string } | null
}

interface AccionPendiente {
  id: string
  tipo: string
  justificacion: string | null
  estado: string
  created_at: string
  vendedor: { nombre: string } | null
  cliente: { nombre: string } | null
  destino: { nombre: string } | null
}

interface Props {
  nombre: string
  fecha: string
  kpis: {
    total: number
    activos: number
    inactivos: number
    nuevosEsteMes: number
    cambioTotal: string
    cambioActivos: string
    cambioNuevos: string
    cambioInactivos: string
  }
  estadoCounts: Record<string, number>
  datosPorPeriodo: Record<string, { label: string; clientes: number }[]>
  actividadReciente: Nota[]
  accionesPendientes: AccionPendiente[]
}

export default function DashboardAdmin({ nombre, fecha, kpis, estadoCounts, datosPorPeriodo, actividadReciente, accionesPendientes }: Props) {
  const { t } = useLanguage()
  const [acciones, setAcciones] = useState<AccionPendiente[]>(accionesPendientes)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  async function decidir(id: string, decision: "aprobada" | "rechazada") {
    setProcesando(id)
    try {
      await fetch(`/api/acciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, motivo_rechazo: motivo || null }),
      })
      setAcciones(prev => prev.filter(a => a.id !== id))
      setRechazando(null)
      setMotivo("")
      toast.success(decision === "aprobada" ? "Acción aprobada" : "Acción rechazada")
    } catch {
      toast.error("Error al procesar")
    } finally {
      setProcesando(null)
    }
  }

  const TIPO_LABEL: Record<string, string> = {
    transfer: t.va.transfer, liberar: t.va.liberar,
  }

  const stats = [
    { label: t.da.totalClients, value: kpis.total, change: kpis.cambioTotal, up: !kpis.cambioTotal.startsWith("-"), icon: Users, accent: "bg-blue-600" },
    { label: t.da.activeClients, value: kpis.activos, change: kpis.cambioActivos, up: !kpis.cambioActivos.startsWith("-"), icon: UserCheck, accent: "bg-sky-500" },
    { label: t.da.newThisMonth, value: kpis.nuevosEsteMes, change: kpis.cambioNuevos, up: !kpis.cambioNuevos.startsWith("-"), icon: TrendingUp, accent: "bg-indigo-500" },
    { label: t.da.inactive, value: kpis.inactivos, change: kpis.cambioInactivos, up: false, icon: UserX, accent: "bg-rose-500" },
  ]

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{t.da.greeting}, {nombre} 👋</h1>
          <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 capitalize font-medium">{fecha}</p>
        </div>
        <Link
          href="/dashboard/clientes/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-md border-2 border-blue-700"
        >
          {t.da.newClient}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, up, icon: Icon, accent }) => (
          <div key={label} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-black dark:text-white font-bold text-sm">{label}</p>
              <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-4xl font-black text-black dark:text-white">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {up ? <ArrowUpRight size={14} className="text-blue-600" /> : <ArrowDownRight size={14} className="text-rose-500" />}
              <span className={`text-xs font-bold ${up ? "text-blue-600" : "text-rose-500"}`}>{change}</span>
              <span className="text-black/30 text-xs font-medium">{t.da.vsPrev}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fila central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white">{t.da.clientsPerMonth}</h2>
              <p className="text-black/40 dark:text-white/40 text-xs mt-0.5 font-medium">{t.da.last12m}</p>
            </div>
            <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold border-2 border-blue-700">{t.da.thisYear}</span>
          </div>
          <GraficaLinea datosPorPeriodo={datosPorPeriodo} />
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-black dark:text-white mb-1">{t.da.pipeline}</h2>
          <p className="text-black/40 dark:text-white/40 text-xs mb-2 font-medium">{t.da.distribution}</p>
          <GraficaDona estadoCounts={estadoCounts} />
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-black dark:text-white mb-4">{t.da.recentActivity}</h2>
          {actividadReciente.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
              <p className="text-black/30 dark:text-white/30 text-xs font-semibold">{t.da.noActivity}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actividadReciente.map((nota, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                  <MessageSquare size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black dark:text-white truncate">{nota.cliente?.nombre ?? "—"}</p>
                    <p className="text-xs text-black/50 dark:text-white/50 font-medium truncate">{nota.contenido}</p>
                    <p className="text-xs text-black/30 dark:text-white/30 font-medium mt-0.5">{nota.autor?.nombre ?? "—"} · {formatFecha(nota.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
