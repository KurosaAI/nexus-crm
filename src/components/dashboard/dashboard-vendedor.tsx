"use client"

import { Phone, UserPlus, FileText, Trophy, Clock, AlertTriangle, CheckCircle, ArrowRight, PauseCircle, User, Handshake } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/i18n/context"

interface ClientePausa {
  id: string
  nombre: string
  empresa: string | null
  estado: string
  vendedor_original_id: string
  perfilOriginal: { nombre: string } | null
}

interface ClienteColab {
  id: string
  nombre: string
  empresa: string | null
  estado: string
  vendedor: { nombre: string } | null
}

interface Metricas {
  totalMisClientes: number
  contactadosHoy: number
  propuestas: number
  cierres: number
}

interface Props {
  nombre: string
  fecha: string
  metricas: Metricas
  clientesEnPausa: ClientePausa[]
  clientesColaborando: ClienteColab[]
}

const ESTADO_BADGE: Record<string, string> = {
  prospecto: "bg-gray-200 text-black",
  contactado: "bg-sky-500 text-white",
  propuesta: "bg-indigo-500 text-white",
  cliente: "bg-blue-600 text-white",
  inactivo: "bg-red-100 text-red-700",
}

export default function DashboardVendedor({ nombre, fecha, metricas, clientesEnPausa, clientesColaborando }: Props) {
  const { t } = useLanguage()

  const misMetricas = [
    { label: t.dv.myClients, value: String(metricas.totalMisClientes), icon: UserPlus, accent: "bg-blue-600", sub: t.dv.assignedTo },
    { label: t.dv.contactedToday, value: String(metricas.contactadosHoy), icon: Phone, accent: "bg-sky-500", sub: t.dv.ofYourClients },
    { label: t.dv.proposals, value: String(metricas.propuestas), icon: FileText, accent: "bg-indigo-500", sub: t.dv.thisMonth },
    { label: t.dv.closings, value: String(metricas.cierres), icon: Trophy, accent: "bg-emerald-500", sub: t.dv.newClients },
  ]

  const miPipeline = [
    { estado: t.cl.prospect, color: "border-gray-300 bg-gray-50", badge: "bg-gray-200 text-black" },
    { estado: t.cl.contacted, color: "border-sky-300 bg-sky-50", badge: "bg-sky-500 text-white" },
    { estado: t.cl.proposal, color: "border-indigo-300 bg-indigo-50", badge: "bg-indigo-500 text-white" },
    { estado: t.cl.client, color: "border-blue-300 bg-blue-50", badge: "bg-blue-600 text-white" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{t.dv.greeting}, {nombre} 👋</h1>
          <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 capitalize font-medium">{fecha}</p>
        </div>
        <Link
          href="/dashboard/clientes/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-md border-2 border-blue-700"
        >
          {t.dv.addClient}
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {misMetricas.map(({ label, value, icon: Icon, accent, sub }) => (
          <div key={label} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-black dark:text-white font-bold text-sm">{label}</p>
              <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-4xl font-black text-black dark:text-white">{value}</p>
            <p className="text-black/40 dark:text-white/40 text-xs font-semibold mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Clientes en pausa temporal */}
      {clientesEnPausa.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                <PauseCircle size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">{t.dv.pausedClients} ({clientesEnPausa.length})</h2>
                <p className="text-black/50 text-xs font-medium mt-0.5">{t.dv.pausedClientsDesc}</p>
              </div>
            </div>
            <span className="text-xs bg-amber-400 text-white px-2.5 py-1 rounded-lg font-black border-2 border-amber-500">
              {t.dv.returnsWhen}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientesEnPausa.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/clientes/${c.id}`}
                className="flex items-center gap-3 bg-white border-2 border-amber-200 rounded-xl p-3 hover:border-amber-400 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-black truncate">{c.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.empresa && <p className="text-xs text-black/40 font-medium truncate">{c.empresa}</p>}
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${ESTADO_BADGE[c.estado] ?? "bg-gray-200 text-black"}`}>
                      {c.estado}
                    </span>
                  </div>
                  {c.perfilOriginal && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
                      de: {c.perfilOriginal.nombre}
                    </p>
                  )}
                </div>
                <ArrowRight size={14} className="text-black/20 group-hover:text-amber-500 flex-shrink-0 transition" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Colaboraciones activas */}
      {clientesColaborando.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Handshake size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">{t.cl.collaborate} ({clientesColaborando.length})</h2>
                <p className="text-black/50 text-xs font-medium mt-0.5">{t.cl.collaborating}</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-black border-2 border-emerald-600">
              {t.cl.collaborator}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientesColaborando.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/clientes/${c.id}`}
                className="flex items-center gap-3 bg-white border-2 border-emerald-200 rounded-xl p-3 hover:border-emerald-400 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-black truncate">{c.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.empresa && <p className="text-xs text-black/40 font-medium truncate">{c.empresa}</p>}
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${ESTADO_BADGE[c.estado] ?? "bg-gray-200 text-black"}`}>
                      {c.estado}
                    </span>
                  </div>
                  {c.vendedor && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
                      de: {c.vendedor.nombre}
                    </p>
                  )}
                </div>
                <ArrowRight size={14} className="text-black/20 group-hover:text-emerald-500 flex-shrink-0 transition" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline + Seguimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white">{t.dv.myPipeline}</h2>
              <p className="text-black/40 dark:text-white/40 text-xs mt-0.5 font-medium">{t.dv.byStage}</p>
            </div>
            <Link href="/dashboard/clientes" className="text-xs text-blue-600 font-bold border-2 border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition">
              {t.dv.viewAll}
            </Link>
          </div>
          <div className="space-y-3">
            {miPipeline.map(({ estado, color, badge }) => (
              <div key={estado} className={`border-2 ${color} rounded-xl p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${badge}`}>{estado}</span>
                  <span className="text-xs font-semibold text-black/50">{t.dv.noClientsStage}</span>
                </div>
                <Link href="/dashboard/clientes" className="text-black/30 hover:text-blue-600 transition">
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white">{t.dv.followUps}</h2>
              <p className="text-black/40 dark:text-white/40 text-xs mt-0.5 font-medium">{t.dv.noRecentContact}</p>
            </div>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
            <CheckCircle size={16} className="text-emerald-400 mb-1" />
            <p className="text-black/30 dark:text-white/30 text-xs font-semibold text-center">{t.dv.upToDate}</p>
          </div>
        </div>
      </div>

      {/* Mis solicitudes */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-black dark:text-white">{t.dv.myRequests}</h2>
            <p className="text-black/40 dark:text-white/40 text-xs mt-0.5 font-medium">{t.dv.sentToAdmin}</p>
          </div>
          <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-black border-2 border-blue-700">0 {t.dv.pending}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left font-bold text-black dark:text-white pb-2">{t.dv.action}</th>
                <th className="text-left font-bold text-black dark:text-white pb-2">{t.dv.status}</th>
                <th className="text-left font-bold text-black dark:text-white pb-2">{t.dv.date}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Clock size={16} className="text-black/20 dark:text-white/20" />
                    <p className="text-black/30 dark:text-white/30 font-semibold">{t.dv.noRequestsYet}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
