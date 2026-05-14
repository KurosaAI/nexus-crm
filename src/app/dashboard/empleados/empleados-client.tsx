"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { UserCog, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/i18n/context"

interface Empleado {
  id: string
  nombre: string
  usuario: string | null
  codigo_acceso: string | null
  activo: boolean
  estado_empleado: string
  clientesAsignados: number
  clientesPrestados: number
}

const ESTADO_BADGES: Record<string, string> = {
  activo:      "bg-green-50 border-green-200 text-green-700",
  pausado:     "bg-yellow-50 border-yellow-200 text-yellow-700",
  restringido: "bg-orange-50 border-orange-200 text-orange-700",
  en_aviso:    "bg-red-50 border-red-200 text-red-600",
  inactivo:    "bg-gray-100 border-gray-200 text-black/40",
}

export default function EmpleadosClient({ empleados: inicial }: { empleados: Empleado[] }) {
  const { t } = useLanguage()
  const [empleados, setEmpleados] = useState(inicial)
  const [busqueda, setBusqueda] = useState("")
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null)
  const [confirmCambio, setConfirmCambio] = useState<{ emp: Empleado; nuevoEstado: string } | null>(null)
  const [cargando, setCargando] = useState<string | null>(null)

  const filtrados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.codigo_acceso ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.usuario ?? "").toLowerCase().includes(busqueda.toLowerCase())
  )

  function solicitarCambio(emp: Empleado, nuevoEstado: string) {
    if (nuevoEstado === emp.estado_empleado) return
    // Pedir confirmación si hay movimiento de clientes
    const requiereConfirm =
      nuevoEstado === "pausado" ||
      nuevoEstado === "inactivo" ||
      emp.estado_empleado === "pausado" // salir de pausa siempre devuelve clientes
    if (requiereConfirm) {
      setConfirmCambio({ emp, nuevoEstado })
    } else {
      cambiarEstado(emp, nuevoEstado)
    }
  }

  async function cambiarEstado(emp: Empleado, nuevoEstado: string) {
    setConfirmCambio(null)
    setCargando(emp.id)
    const res = await fetch(`/api/empleados/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_empleado: nuevoEstado }),
    })
    if (res.ok) {
      setEmpleados(prev => prev.map(e => e.id === emp.id
        ? { ...e, estado_empleado: nuevoEstado, activo: nuevoEstado === "activo" }
        : e
      ))
      const stateLabels: Record<string, string> = { activo: t.em.stateActivo, pausado: t.em.statePausado, restringido: t.em.stateRestringido, en_aviso: t.em.stateEnAviso, inactivo: t.em.stateInactivo }
      toast.success(`${emp.nombre} → ${stateLabels[nuevoEstado] ?? nuevoEstado}`)
    } else {
      toast.error(t.em.errorChangeStatus)
    }
    setCargando(null)
  }

  async function eliminar(id: string) {
    setCargando(id)
    const res = await fetch(`/api/empleados/${id}`, { method: "DELETE" })
    if (res.ok) {
      setEmpleados(prev => prev.filter(e => e.id !== id))
      toast.success(t.em.deleteSuccess)
    } else {
      toast.error(t.em.errorDelete)
    }
    setConfirmEliminar(null)
    setCargando(null)
  }

  function mensajeConfirmacion(emp: Empleado, nuevoEstado: string): string {
    if (nuevoEstado === "pausado")
      return `Los ${emp.clientesAsignados} clientes de ${emp.nombre} serán reasignados temporalmente. Al quitarlo de pausa, sus clientes regresan automáticamente.`
    if (nuevoEstado === "inactivo")
      return `Los ${emp.clientesAsignados} clientes de ${emp.nombre} serán reasignados permanentemente. Esta acción no se puede deshacer.`
    if (emp.estado_empleado === "pausado")
      return `${emp.nombre} recuperará sus clientes originales automáticamente al salir de pausa.`
    return ""
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{t.em.title}</h1>
          <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">{t.em.subtitle}</p>
        </div>
        <Link
          href="/dashboard/empleados/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-md border-2 border-blue-700"
        >
          <Plus size={16} />
          {t.em.newEmployee}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            placeholder={t.em.search}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {[t.em.colName, t.em.colUser, t.em.colCode, t.em.colClients, t.em.colStatus, t.em.colChangeStatus, t.em.colActions].map(h => (
                  <th key={h} className="text-left text-xs font-black text-black dark:text-white px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? (
                filtrados.map((emp) => {
                  return (
                    <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white">{emp.nombre}</p>
                          {emp.estado_empleado === "en_aviso" && (
                            <p className="text-xs text-red-500 font-semibold">⚠ {t.em.warningInfraction}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-black/70 dark:text-white/70">{emp.usuario ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 rounded-lg bg-blue-50 border-2 border-blue-200 text-xs font-bold text-blue-700">
                          {emp.codigo_acceso ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-black dark:text-white">{emp.clientesAsignados}</p>
                        {emp.clientesPrestados > 0 && (
                          <p className="text-xs text-yellow-600 font-semibold mt-0.5">
                            ⏸ {emp.clientesPrestados} {t.em.clientsPaused}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold border-2 ${ESTADO_BADGES[emp.estado_empleado] ?? ESTADO_BADGES.activo}`}>
                            {{ activo: t.em.stateActivo, pausado: t.em.statePausado, restringido: t.em.stateRestringido, en_aviso: t.em.stateEnAviso, inactivo: t.em.stateInactivo }[emp.estado_empleado] ?? emp.estado_empleado}
                          </span>
                          <p className="text-xs text-black/30 dark:text-white/30 font-medium mt-0.5">{{ activo: t.em.descActivo, pausado: t.em.descPausado, restringido: t.em.descRestringido, en_aviso: t.em.descEnAviso, inactivo: t.em.descInactivo }[emp.estado_empleado] ?? ""}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={emp.estado_empleado}
                          disabled={cargando === emp.id}
                          onChange={e => solicitarCambio(emp, e.target.value)}
                          className="text-xs font-semibold px-2 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white bg-white dark:bg-gray-700 transition cursor-pointer disabled:opacity-40"
                        >
                          <option value="activo">{t.em.optActivo}</option>
                          <option value="pausado">{t.em.optPausado}</option>
                          <option value="restringido">{t.em.optRestringido}</option>
                          <option value="en_aviso">{t.em.optEnAviso}</option>
                          <option value="inactivo">{t.em.optInactivo}</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setConfirmEliminar(emp.id)}
                          disabled={cargando === emp.id}
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-black dark:text-white hover:border-red-400 hover:text-red-500 transition disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserCog size={32} className="text-black/10 dark:text-white/10" />
                      <p className="text-black dark:text-white font-bold text-sm">{t.em.noEmployees}</p>
                      <p className="text-black/40 dark:text-white/40 text-xs font-medium">{t.em.createFirst}</p>
                      <Link
                        href="/dashboard/empleados/nuevo"
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-2 border-blue-700 transition"
                      >
                        <Plus size={14} />
                        {t.em.newEmployee}
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmar cambio de estado con efecto en clientes */}
      {confirmCambio && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              confirmCambio.nuevoEstado === "inactivo" ? "bg-red-100 border-2 border-red-200" : "bg-yellow-100 border-2 border-yellow-200"
            }`}>
              <UserCog size={18} className={confirmCambio.nuevoEstado === "inactivo" ? "text-red-500" : "text-yellow-600"} />
            </div>
            <h3 className="text-sm font-bold text-black dark:text-white mb-2">
              {confirmCambio.nuevoEstado === "inactivo" ? t.em.fireTitle :
               confirmCambio.nuevoEstado === "pausado" ? t.em.pauseTitle :
               t.em.reactivateTitle}
            </h3>
            <p className="text-black/50 dark:text-white/50 text-xs font-medium mb-4">
              {mensajeConfirmacion(confirmCambio.emp, confirmCambio.nuevoEstado)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCambio(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition"
              >
                {t.em.cancel}
              </button>
              <button
                onClick={() => cambiarEstado(confirmCambio.emp, confirmCambio.nuevoEstado)}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold border-2 transition ${
                  confirmCambio.nuevoEstado === "inactivo"
                    ? "bg-red-500 hover:bg-red-600 border-red-600"
                    : "bg-blue-600 hover:bg-blue-700 border-blue-700"
                }`}
              >
                {t.em.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-red-200 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-black mb-1">{t.em.deleteTitle}</h3>
            <p className="text-black/50 dark:text-white/50 text-xs font-medium mb-4">{t.em.deleteDesc}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition">
                {t.em.cancel}
              </button>
              <button onClick={() => eliminar(confirmEliminar)} disabled={!!cargando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold border-2 border-red-600 transition">
                {cargando ? "..." : t.em.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
