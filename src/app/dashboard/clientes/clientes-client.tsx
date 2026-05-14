"use client"

import { useState, useMemo } from "react"
import { Users, Search, Download, Plus, Pencil, Trash2, ArrowUpDown, X, Shuffle, Handshake, Save, Zap, ArrowLeftRight, TriangleAlert, HelpCircle, Flame, UserMinus, ArrowDownToLine } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useLanguage } from "@/i18n/context"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, EstadoCliente } from "@/lib/supabase/types"
import { ESTADO_COLORS, ESTADO_KEYS } from "@/lib/supabase/types"

interface SolicitudCompartir {
  id: string
  cliente_id: string
  vendedor_id: string
  justificacion: string | null
  created_at: string
  cliente: { nombre: string } | null
  solicitante: { nombre: string } | null
}

interface Props {
  clientes: Cliente[]
  vendedores: { id: string; nombre: string }[]
  rol: "admin" | "vendedor"
  userId: string
  solicitudesEntrantes: SolicitudCompartir[]
}

export default function ClientesClient({ clientes: inicial, vendedores, rol, userId, solicitudesEntrantes: solicitudesInit }: Props) {
  const { t } = useLanguage()
  const supabase = createClient()

  const [clientes, setClientes] = useState(inicial)
  const [filtroActivo, setFiltroActivo] = useState("all")
  const [filtroVendedor, setFiltroVendedor] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [asignando, setAsignando] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [editForm, setEditForm] = useState({ nombre: "", empresa: "", email: "", telefono: "" })
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [clienteColaborando, setClienteColaborando] = useState<Cliente | null>(null)
  const [colaboradorId, setColaboradorId] = useState("")
  const [guardandoColab, setGuardandoColab] = useState(false)
  const [clienteAcciones, setClienteAcciones] = useState<Cliente | null>(null)
  const [accionSeleccionada, setAccionSeleccionada] = useState<string | null>(null)
  const [accionJustificacion, setAccionJustificacion] = useState("")
  const [accionDestino, setAccionDestino] = useState("")
  const [enviandoAccion, setEnviandoAccion] = useState(false)
  const [solicitudesEntrantes, setSolicitudesEntrantes] = useState<SolicitudCompartir[]>(solicitudesInit)
  const [respondiendoSolicitud, setRespondiendoSolicitud] = useState<string | null>(null)

  const estados = [
    { key: "all", label: t.cl.all },
    { key: "prospecto", label: t.cl.prospect },
    { key: "contactado", label: t.cl.contacted },
    { key: "propuesta", label: t.cl.proposal },
    { key: "cliente", label: t.cl.client },
    { key: "inactivo", label: t.cl.inactive },
  ]

  const estadoLabel: Record<string, string> = {
    prospecto: t.cl.prospect,
    contactado: t.cl.contacted,
    propuesta: t.cl.proposal,
    cliente: t.cl.client,
    inactivo: t.cl.inactive,
  }

  const sinAsignarCount = clientes.filter(c => !c.vendedor_id).length

  const filtroLabel = filtroActivo === "sin_asignar"
    ? "Sin asignar"
    : (estados.find(e => e.key === filtroActivo)?.label ?? "")

  const clientesFiltrados = clientes.filter(c => {
    const matchEstado = filtroActivo === "all"
      || (filtroActivo === "sin_asignar" ? !c.vendedor_id : c.estado === filtroActivo)
    const matchVendedor = !filtroVendedor || c.vendedor_id === filtroVendedor
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q || [c.nombre, c.email, c.empresa].some(v => v?.toLowerCase().includes(q))
    return matchEstado && matchVendedor && matchBusqueda
  })

  const todosSeleccionados = clientesFiltrados.length > 0 && clientesFiltrados.every(c => seleccionados.has(c.id))
  const algunoSeleccionado = seleccionados.size > 0

  const clientesPorVendedor = useMemo(() => {
    const counts: Record<string, number> = {}
    vendedores.forEach(v => { counts[v.id] = 0 })
    clientes.forEach(c => { if (c.vendedor_id) counts[c.vendedor_id] = (counts[c.vendedor_id] ?? 0) + 1 })
    return counts
  }, [clientes, vendedores])

  function toggleSeleccion(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (todosSeleccionados) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(clientesFiltrados.map(c => c.id)))
    }
  }

  function limpiarSeleccion() { setSeleccionados(new Set()) }

  async function cambiarEstado(id: string, estadoActual: EstadoCliente, nuevoEstado: EstadoCliente) {
    if (estadoActual === nuevoEstado) return
    setClientes(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c))
    await supabase.from("clientes").update({ estado: nuevoEstado }).eq("id", id)
    toast.success(t.cl.statusUpdated)
  }

  async function asignarVendedor(id: string, vendedorId: string) {
    const vendedor = vendedores.find(v => v.id === vendedorId) ?? null
    setClientes(prev => prev.map(c => c.id === id
      ? { ...c, vendedor_id: vendedorId || undefined, vendedor: vendedor } : c
    ))
    await supabase.from("clientes").update({ vendedor_id: vendedorId || null }).eq("id", id)
    toast.success(vendedorId ? `${t.cl.assigned} ${vendedor?.nombre}` : t.cl.unassigned2)
  }

  async function asignarAVendedor(vendedorId: string) {
    if (seleccionados.size === 0) return
    setAsignando(true)
    const ids = Array.from(seleccionados)
    const vendedor = vendedores.find(v => v.id === vendedorId) ?? null
    setClientes(prev => prev.map(c => ids.includes(c.id)
      ? { ...c, vendedor_id: vendedorId || undefined, vendedor: vendedor } : c
    ))
    limpiarSeleccion()
    await supabase.from("clientes").update({ vendedor_id: vendedorId || null }).in("id", ids)
    setAsignando(false)
    toast.success(`${ids.length} ${t.cl.clients} ${t.cl.assigned} ${vendedor?.nombre}`)
  }

  async function distribuirEquitativamente() {
    if (seleccionados.size === 0 || vendedores.length === 0) return
    setAsignando(true)
    const ids = Array.from(seleccionados)
    const counts = vendedores.map(v => ({ id: v.id, count: clientesPorVendedor[v.id] ?? 0 }))
    const grupos: Record<string, string[]> = {}

    for (const id of ids) {
      counts.sort((a, b) => a.count - b.count)
      const destino = counts[0]
      if (!grupos[destino.id]) grupos[destino.id] = []
      grupos[destino.id].push(id)
      destino.count++
    }

    setClientes(prev => prev.map(c => {
      for (const [vendedorId, clienteIds] of Object.entries(grupos)) {
        if (clienteIds.includes(c.id)) {
          const vendedor = vendedores.find(v => v.id === vendedorId) ?? null
          return { ...c, vendedor_id: vendedorId, vendedor }
        }
      }
      return c
    }))
    limpiarSeleccion()

    await Promise.all(
      Object.entries(grupos).map(([vendedorId, clienteIds]) =>
        supabase.from("clientes").update({ vendedor_id: vendedorId }).in("id", clienteIds)
      )
    )
    setAsignando(false)
    toast.success(`${ids.length} ${t.cl.clients} ${t.cl.distributeBtn} ${vendedores.length}`)
  }

  function abrirEdicion(c: Cliente) {
    setClienteEditando(c)
    setEditForm({ nombre: c.nombre, empresa: c.empresa ?? "", email: c.email ?? "", telefono: c.telefono ?? "" })
  }

  async function guardarEdicion() {
    if (!clienteEditando) return
    setGuardandoEdit(true)
    await supabase.from("clientes").update({
      nombre: editForm.nombre,
      empresa: editForm.empresa || null,
      email: editForm.email || null,
      telefono: editForm.telefono || null,
    }).eq("id", clienteEditando.id)
    setClientes(prev => prev.map(c => c.id === clienteEditando.id
      ? { ...c, ...editForm, empresa: editForm.empresa || undefined, email: editForm.email || undefined, telefono: editForm.telefono || undefined }
      : c
    ))
    setClienteEditando(null)
    setGuardandoEdit(false)
    toast.success(t.st.nameSaved)
  }

  function abrirColaboracion(c: Cliente) {
    setClienteColaborando(c)
    setColaboradorId((c as any).colaborador_id ?? "")
  }

  async function guardarColaborador() {
    if (!clienteColaborando) return
    setGuardandoColab(true)
    await supabase.from("clientes").update({ colaborador_id: colaboradorId || null }).eq("id", clienteColaborando.id)
    setClientes(prev => prev.map(c => c.id === clienteColaborando.id
      ? { ...c, colaborador_id: colaboradorId || null } as any
      : c
    ))
    if (colaboradorId) {
      await fetch("/api/notificaciones-crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: colaboradorId,
          tipo: "colaboracion",
          mensaje: `Fuiste invitado a colaborar en el cierre del cliente "${clienteColaborando.nombre}".`,
        }),
      }).catch(() => {})
    }
    setClienteColaborando(null)
    setGuardandoColab(false)
    toast.success(colaboradorId ? t.cl.collaborate : t.cl.removeCollaborator)
  }

  async function enviarAccion() {
    if (!clienteAcciones || !accionSeleccionada) return
    const NECESITAN_APROBACION = ["transfer", "liberar"]
    const NECESITAN_DESTINO = ["transfer", "share", "help"]
    const necesitaJustificacion = NECESITAN_APROBACION.includes(accionSeleccionada)
    if (necesitaJustificacion && !accionJustificacion.trim()) return
    if (NECESITAN_DESTINO.includes(accionSeleccionada) && !accionDestino) return
    setEnviandoAccion(true)
    try {
      const res = await fetch("/api/acciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteAcciones.id,
          tipo: accionSeleccionada,
          justificacion: accionJustificacion || null,
          destino_id: accionDestino || null,
          estado: necesitaJustificacion ? "pendiente" : "informativa",
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t.va.sent)
      setClienteAcciones(null)
      setAccionSeleccionada(null)
      setAccionJustificacion("")
      setAccionDestino("")
    } catch {
      toast.error(t.va.error)
    } finally {
      setEnviandoAccion(false)
    }
  }

  async function responderSolicitudCompartir(solicitudId: string, decision: "aprobada" | "rechazada") {
    setRespondiendoSolicitud(solicitudId)
    try {
      const res = await fetch(`/api/acciones/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        setSolicitudesEntrantes(prev => prev.filter(s => s.id !== solicitudId))
        toast.success(decision === "aprobada" ? "Colaboración aceptada" : "Solicitud rechazada")
      } else {
        toast.error("Error al procesar la solicitud")
      }
    } catch {
      toast.error("Error al procesar la solicitud")
    } finally {
      setRespondiendoSolicitud(null)
    }
  }

  async function eliminarCliente(id: string) {
    setEliminando(true)
    await supabase.from("clientes").delete().eq("id", id)
    setClientes(prev => prev.filter(c => c.id !== id))
    setConfirmEliminar(null)
    setEliminando(false)
    toast.success(t.cl.clientDeleted)
  }

  return (
    <div className="space-y-5">

      {/* Solicitudes de colaboración entrantes */}
      {solicitudesEntrantes.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Handshake size={16} className="text-emerald-600" />
            <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
              Solicitudes de compartir cierre ({solicitudesEntrantes.length})
            </p>
          </div>
          {solicitudesEntrantes.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-xl p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-black dark:text-white truncate">
                  {s.solicitante?.nombre ?? "Un compañero"} quiere colaborar en el cierre de <span className="text-emerald-700 dark:text-emerald-400">"{s.cliente?.nombre}"</span>
                </p>
                {s.justificacion && (
                  <p className="text-xs text-black/50 dark:text-white/50 font-medium mt-0.5 truncate">"{s.justificacion}"</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => responderSolicitudCompartir(s.id, "rechazada")}
                  disabled={respondiendoSolicitud === s.id}
                  className="px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-xs font-bold text-black dark:text-white hover:border-red-400 hover:text-red-500 transition disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => responderSolicitudCompartir(s.id, "aprobada")}
                  disabled={respondiendoSolicitud === s.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-700 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {respondiendoSolicitud === s.id ? "..." : "Aceptar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{t.cl.title}</h1>
          <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">{t.cl.subtitle}</p>
        </div>
        <Link href="/dashboard/clientes/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-md border-2 border-blue-700">
          <Plus size={16} />{t.cl.newClient}
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input type="text" placeholder={t.cl.search} value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition" />
          </div>
          {rol === "admin" && vendedores.length > 0 && (
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white font-semibold transition">
              <option value="">{t.cl.allSellers}</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition">
            <Download size={15} />{t.cl.export}
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {estados.map((e) => (
            <button key={e.key} onClick={() => setFiltroActivo(e.key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition ${
                filtroActivo === e.key ? "bg-blue-600 text-white border-blue-700" : "bg-white dark:bg-gray-700 text-black dark:text-white border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600"
              }`}>
              {e.label}
            </button>
          ))}
          {rol === "admin" && (
            <button onClick={() => setFiltroActivo(filtroActivo === "sin_asignar" ? "all" : "sin_asignar")}
              className={`relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border-2 transition ${
                filtroActivo === "sin_asignar"
                  ? "bg-red-500 text-white border-red-600"
                  : "bg-white dark:bg-gray-700 text-black dark:text-white border-gray-200 dark:border-gray-600 hover:border-red-400 hover:text-red-500"
              }`}>
              Sin asignar
              {sinAsignarCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  filtroActivo === "sin_asignar" ? "bg-white text-red-500" : "bg-red-500 text-white animate-pulse"
                }`}>
                  {sinAsignarCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {filtroActivo !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-black/50 dark:text-white/50">{t.cl.filteringBy}</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold border-2 border-blue-700">{filtroLabel}</span>
          <button onClick={() => setFiltroActivo("all")} className="text-xs font-bold text-black/40 hover:text-red-500 transition">{t.cl.clear}</button>
        </div>
      )}

      {/* Panel de asignación masiva */}
      {rol === "admin" && algunoSeleccionado && vendedores.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-black dark:text-white">
              {seleccionados.size} {t.cl.clients} — {t.cl.assignQuestion}
            </p>
            <button onClick={limpiarSeleccion} className="text-black/30 hover:text-red-500 transition">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {vendedores.map(v => (
              <button key={v.id} onClick={() => asignarAVendedor(v.id)} disabled={asignando}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition group">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-black text-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition">
                  {v.nombre.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-black dark:text-white text-center leading-tight">{v.nombre}</p>
                <span className="text-xs font-semibold text-black/40 dark:text-white/40">{clientesPorVendedor[v.id] ?? 0} {t.cl.clients}</span>
              </button>
            ))}
          </div>
          {vendedores.length > 1 && (
            <button onClick={distribuirEquitativamente} disabled={asignando}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-indigo-300 bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100 hover:border-indigo-400 disabled:opacity-50 transition">
              <Shuffle size={15} />
              {asignando ? t.cl.distributing : `${t.cl.distributeBtn} ${vendedores.length}`}
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {rol === "admin" && (
                  <th className="px-4 py-3 w-10">
                    <div className="flex flex-col items-center gap-0.5">
                      <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos}
                        className="w-4 h-4 rounded border-2 border-gray-300 accent-blue-600 cursor-pointer" />
                      <span className="text-[9px] font-bold text-black/30 dark:text-white/30 leading-none">{todosSeleccionados ? t.cl.deselectAll.slice(0,3) : "Sel."}</span>
                    </div>
                  </th>
                )}
                {[t.cl.colName, t.cl.colCompany, t.cl.colEmail, t.cl.colPhone, t.cl.colStatus, t.cl.colSeller, t.cl.colActions].map(h => (
                  <th key={h} className="text-left text-xs font-black text-black dark:text-white px-5 py-3">
                    <span className="flex items-center gap-1">{h}<ArrowUpDown size={10} className="text-black/20 dark:text-white/20" /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((c) => (
                  <tr key={c.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition ${seleccionados.has(c.id) ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}>
                    {rol === "admin" && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={seleccionados.has(c.id)} onChange={() => toggleSeleccion(c.id)}
                          className="w-4 h-4 rounded border-2 border-gray-300 accent-blue-600 cursor-pointer" />
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/clientes/${c.id}`} className="text-sm font-bold text-black dark:text-white hover:text-blue-600 transition">
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-black/60 dark:text-white/60">{c.empresa || "—"}</td>
                    <td className="px-5 py-3 text-sm font-medium text-black/60 dark:text-white/60">{c.email || "—"}</td>
                    <td className="px-5 py-3 text-sm font-medium text-black/60 dark:text-white/60">{c.telefono || "—"}</td>
                    <td className="px-5 py-3">
                      <select value={c.estado}
                        onChange={e => cambiarEstado(c.id, c.estado as EstadoCliente, e.target.value as EstadoCliente)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border-2 cursor-pointer focus:outline-none transition ${ESTADO_COLORS[c.estado as EstadoCliente] ?? "bg-gray-100 border-gray-200 text-black/60"}`}>
                        {ESTADO_KEYS.map(k => <option key={k} value={k}>{estadoLabel[k]}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      {rol === "admin" && vendedores.length > 0 ? (
                        <div className="space-y-1">
                          <select value={c.vendedor_id ?? ""}
                            onChange={e => asignarVendedor(c.id, e.target.value)}
                            className="text-xs font-semibold px-2 py-1 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white bg-white dark:bg-gray-700 transition cursor-pointer">
                            <option value="">{t.nc.unassigned}</option>
                            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                          </select>
                          {(c as any).vendedor_original?.nombre && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold">
                              ⏸ De: {(c as any).vendedor_original.nombre}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-black/60 dark:text-white/60">{(c.vendedor as any)?.nombre || "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {(c as any).colaborador_id && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center gap-1">
                            <Handshake size={10} />{t.cl.collaborating}
                          </span>
                        )}
                        <button onClick={() => abrirEdicion(c)}
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-black dark:text-white hover:border-blue-400 hover:text-blue-600 transition"
                          title={t.cl.editClient}>
                          <Pencil size={13} />
                        </button>
                        {vendedores.length > 0 && (
                          <button onClick={() => abrirColaboracion(c)}
                            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-black dark:text-white hover:border-emerald-400 hover:text-emerald-600 transition"
                            title={t.cl.collaborate}>
                            <Handshake size={13} />
                          </button>
                        )}
                        {rol === "vendedor" && (
                          <button onClick={() => { setClienteAcciones(c); setAccionSeleccionada(null); setAccionJustificacion(""); setAccionDestino("") }}
                            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-black dark:text-white hover:border-amber-400 hover:text-amber-600 transition"
                            title={t.va.title}>
                            <Zap size={13} />
                          </button>
                        )}
                        {rol === "admin" && (
                          <button onClick={() => setConfirmEliminar(c.id)}
                            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-black dark:text-white hover:border-red-400 hover:text-red-500 transition">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={rol === "admin" ? 8 : 7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-black/10 dark:text-white/10" />
                      <p className="text-black dark:text-white font-bold text-sm">{t.cl.noClients}</p>
                      <p className="text-black/40 dark:text-white/40 text-xs font-medium">
                        {filtroActivo !== "all" ? `${t.cl.noClientsFilter} "${filtroLabel}"` : t.cl.createFirst}
                      </p>
                      {filtroActivo === "all" && (
                        <Link href="/dashboard/clientes/nuevo"
                          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-2 border-blue-700 transition">
                          <Plus size={14} />{t.cl.newClient}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {clientesFiltrados.length > 0 && (
          <div className="px-5 py-3 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <p className="text-xs font-semibold text-black/40 dark:text-white/40">{clientesFiltrados.length} {t.cl.clients}</p>
            {rol === "admin" && (
              <button onClick={toggleTodos} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                {todosSeleccionados ? t.cl.deselectAll : `${t.cl.selectAll} (${clientesFiltrados.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-red-200 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-black dark:text-white mb-1">{t.cd.confirmDelete}</h3>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition">
                {t.cd.cancel}
              </button>
              <button onClick={() => eliminarCliente(confirmEliminar)} disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold border-2 border-red-600 transition">
                {eliminando ? "..." : t.cd.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición rápida */}
      {clienteEditando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Pencil size={16} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-black dark:text-white">{t.cl.editClient}</h3>
              </div>
              <button onClick={() => setClienteEditando(null)} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.cl.colName}</label>
                <input type="text" value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-medium transition" />
              </div>
              <div>
                <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.cl.colCompany}</label>
                <input type="text" value={editForm.empresa} onChange={e => setEditForm(f => ({ ...f, empresa: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-medium transition" />
              </div>
              <div>
                <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.cl.colEmail}</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-medium transition" />
              </div>
              <div>
                <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.cl.colPhone}</label>
                <input type="text" value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-medium transition" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setClienteEditando(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition">
                {t.cd.cancel}
              </button>
              <button onClick={guardarEdicion} disabled={guardandoEdit || !editForm.nombre.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold border-2 border-blue-700 transition">
                <Save size={14} />
                {guardandoEdit ? "..." : t.st.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal acciones del vendedor */}
      {clienteAcciones && (() => {
        const ACCIONES = [
          { key: "share",    icon: Handshake,     label: t.va.share,    desc: t.va.shareDesc,    color: "emerald", needsApproval: false },
          { key: "escalate", icon: Flame,          label: t.va.escalate, desc: t.va.escalateDesc, color: "orange",  needsApproval: false },
          { key: "help",     icon: HelpCircle,     label: t.va.help,     desc: t.va.helpDesc,     color: "blue",    needsApproval: false },
          { key: "conflict", icon: TriangleAlert,  label: t.va.conflict, desc: t.va.conflictDesc, color: "red",     needsApproval: false },
          { key: "transfer", icon: ArrowLeftRight, label: t.va.transfer, desc: t.va.transferDesc, color: "indigo",  needsApproval: true  },
          { key: "liberar",  icon: UserMinus,      label: t.va.liberar,  desc: t.va.liberarDesc,  color: "gray",    needsApproval: true  },
        ]
        const accionActual = ACCIONES.find(a => a.key === accionSeleccionada)
        const NECESITAN_DESTINO_LOCAL = ["transfer", "share", "help"]
        const NECESITAN_JUST_LOCAL = ["transfer", "liberar"]
        const canSend = !!accionSeleccionada &&
          (!NECESITAN_DESTINO_LOCAL.includes(accionSeleccionada) || !!accionDestino) &&
          (!NECESITAN_JUST_LOCAL.includes(accionSeleccionada) || !!accionJustificacion.trim())
        const COLORS: Record<string, string> = {
          emerald:"bg-emerald-100 text-emerald-700 border-emerald-300",
          orange: "bg-orange-100 text-orange-700 border-orange-300",
          blue:   "bg-blue-100 text-blue-700 border-blue-300",
          red:    "bg-red-100 text-red-700 border-red-300",
          indigo: "bg-indigo-100 text-indigo-700 border-indigo-300",
          purple: "bg-purple-100 text-purple-700 border-purple-300",
          gray:   "bg-gray-100 text-gray-700 border-gray-300",
        }
        const ICON_COLORS: Record<string, string> = {
          emerald:"bg-emerald-500", orange:"bg-orange-500", blue:"bg-blue-600",
          red:"bg-red-500", indigo:"bg-indigo-600", purple:"bg-purple-500", gray:"bg-gray-500",
        }
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b-2 border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-white">{t.va.title}</h3>
                    <p className="text-xs text-black/40 dark:text-white/40 font-medium truncate max-w-[200px]">{clienteAcciones.nombre}</p>
                  </div>
                </div>
                <button onClick={() => setClienteAcciones(null)} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {!accionSeleccionada ? (
                  ACCIONES.map(({ key, icon: Icon, label, desc, color, needsApproval }) => (
                    <button key={key} onClick={() => setAccionSeleccionada(key)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition text-left group">
                      <div className={`w-8 h-8 rounded-lg ${ICON_COLORS[color]} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-black dark:text-white">{label}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${needsApproval ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-emerald-100 text-emerald-700 border-emerald-300"}`}>
                            {needsApproval ? t.va.needsApproval : t.va.immediate}
                          </span>
                        </div>
                        <p className="text-xs text-black/50 dark:text-white/50 font-medium mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => setAccionSeleccionada(null)} className="flex items-center gap-1.5 text-xs font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition">
                      <ArrowUpDown size={12} />← {t.va.title}
                    </button>
                    {accionActual && (
                      <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${COLORS[accionActual.color]}`}>
                        <accionActual.icon size={14} />
                        <p className="text-sm font-bold">{accionActual.label}</p>
                      </div>
                    )}
                    {accionSeleccionada === "transfer" && (
                      <div>
                        <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.va.destination}</label>
                        <select value={accionDestino} onChange={e => setAccionDestino(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-amber-500 focus:outline-none text-black dark:text-white font-semibold transition">
                          <option value="">—</option>
                          {vendedores.filter(v => v.id !== clienteAcciones.vendedor_id).map(v => (
                            <option key={v.id} value={v.id}>{v.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(accionSeleccionada === "share" || accionSeleccionada === "help") && (
                      <div>
                        <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.va.destination}</label>
                        <select value={accionDestino} onChange={e => setAccionDestino(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-emerald-500 focus:outline-none text-black dark:text-white font-semibold transition">
                          <option value="">—</option>
                          {vendedores.filter(v => v.id !== clienteAcciones.vendedor_id).map(v => (
                            <option key={v.id} value={v.id}>{v.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-black text-black dark:text-white mb-1.5">
                        {accionActual?.needsApproval ? t.va.justification : t.va.detail}
                      </label>
                      <textarea value={accionJustificacion} onChange={e => setAccionJustificacion(e.target.value)}
                        placeholder={t.va.justPlaceholder} rows={3}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-amber-500 focus:outline-none text-black dark:text-white font-medium transition resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setClienteAcciones(null)}
                        className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition">
                        {t.cd.cancel}
                      </button>
                      <button onClick={enviarAccion} disabled={enviandoAccion || !canSend}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold border-2 border-amber-600 transition">
                        <Zap size={14} />
                        {enviandoAccion ? t.va.sending : t.va.send}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal colaboración para el cierre */}
      {clienteColaborando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Handshake size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white">{t.cl.collaborate}</h3>
                  <p className="text-xs text-black/40 dark:text-white/40 font-medium truncate max-w-[160px]">{clienteColaborando.nombre}</p>
                </div>
              </div>
              <button onClick={() => setClienteColaborando(null)} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.cl.collaborator}</label>
              <select value={colaboradorId} onChange={e => setColaboradorId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-emerald-500 focus:outline-none text-black dark:text-white font-semibold transition">
                <option value="">{t.cl.removeCollaborator}</option>
                {vendedores
                  .filter(v => v.id !== clienteColaborando.vendedor_id)
                  .map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
              <p className="text-xs text-black/40 dark:text-white/40 font-medium mt-2">{t.cl.collaborating} — {vendedores.find(v => v.id === colaboradorId)?.nombre ?? "—"}</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setClienteColaborando(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 transition">
                {t.cd.cancel}
              </button>
              <button onClick={guardarColaborador} disabled={guardandoColab}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold border-2 border-emerald-700 transition">
                <Handshake size={14} />
                {guardandoColab ? "..." : t.st.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
