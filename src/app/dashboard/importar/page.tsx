"use client"

import { useRef, useState, useEffect } from "react"
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle2, X, AlertCircle, Eye } from "lucide-react"
import { useLanguage } from "@/i18n/context"
import { createClient } from "@/lib/supabase/client"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const ESTADOS_VALIDOS = ["prospecto", "contactado", "propuesta", "cliente", "inactivo"]

interface FilaCSV {
  nombre?: string
  email?: string
  telefono?: string
  empresa?: string
  estado?: string
  [key: string]: string | undefined
}

interface Vendedor { id: string; nombre: string }

export default function ImportarPage() {
  const { t } = useLanguage()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [filas, setFilas] = useState<FilaCSV[]>([])
  const [verPreview, setVerPreview] = useState(false)
  const [importando, setImportando] = useState(false)
  const [msgImport, setMsgImport] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null)
  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroVendedor, setFiltroVendedor] = useState("")
  const [exportando, setExportando] = useState(false)
  const [periodoRapido, setPeriodoRapido] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data } = await supabase.from("profiles").select("id, nombre").eq("rol", "vendedor").eq("admin_id", user.id)
        setVendedores(data ?? [])
      }
    }
    init()
  }, [])

  function parsearArchivo(file: File) {
    Papa.parse<FilaCSV>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => {
        setFilas(result.data)
        setMsgImport(null)
        setVerPreview(false)
      },
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { setArchivoSeleccionado(file); parsearArchivo(file) }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith(".csv")) { setArchivoSeleccionado(file); parsearArchivo(file) }
  }

  function limpiarArchivo() {
    setArchivoSeleccionado(null)
    setFilas([])
    setMsgImport(null)
    setVerPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function importarClientes() {
    if (filas.length === 0) return
    setImportando(true)
    setMsgImport(null)

    const res = await fetch("/api/clientes/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filas }),
    })
    const data = await res.json()

    if (!res.ok) {
      setMsgImport({ tipo: "err", texto: data.error ?? t.ie.importError })
    } else {
      setMsgImport({ tipo: "ok", texto: `${data.count} ${t.ie.importSuccess}` })
      limpiarArchivo()
    }
    setImportando(false)
  }

  function calcularRangoPeriodo(periodo: string): { desde: string; hasta: string } | null {
    const hoy = new Date()
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    if (periodo === "hoy") {
      return { desde: fmt(hoy), hasta: fmt(hoy) }
    }
    if (periodo === "semana") {
      const lunes = new Date(hoy)
      lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
      return { desde: fmt(lunes), hasta: fmt(hoy) }
    }
    if (periodo === "mes") {
      return { desde: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`, hasta: fmt(hoy) }
    }
    if (periodo === "trimestre") {
      const inicio = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1)
      return { desde: fmt(inicio), hasta: fmt(hoy) }
    }
    if (periodo === "año") {
      return { desde: `${hoy.getFullYear()}-01-01`, hasta: fmt(hoy) }
    }
    return null
  }

  async function exportar(formato: "xlsx" | "csv") {
    if (!userId) return
    setExportando(true)

    let query = supabase
      .from("clientes")
      .select("nombre, email, telefono, empresa, estado, created_at, vendedor:profiles!vendedor_id(nombre)")
      .eq("admin_id", userId)
      .order("created_at", { ascending: false })

    if (filtroEstado) query = query.eq("estado", filtroEstado)
    if (filtroVendedor) query = query.eq("vendedor_id", filtroVendedor)

    // Filtro de fechas
    const rango = periodoRapido ? calcularRangoPeriodo(periodoRapido) : null
    const desde = rango ? rango.desde : fechaDesde
    const hasta = rango ? rango.hasta : fechaHasta
    if (desde) query = query.gte("created_at", `${desde}T00:00:00`)
    if (hasta) query = query.lte("created_at", `${hasta}T23:59:59`)

    const { data } = await query
    const rows = (data ?? []).map((c: any) => ({
      [t.nc.fullName.replace(" *", "")]: c.nombre,
      [t.cd.email]: c.email ?? "",
      [t.cd.phone]: c.telefono ?? "",
      [t.cd.company]: c.empresa ?? "",
      [t.cd.status]: c.estado,
      [t.cd.seller]: c.vendedor?.nombre ?? t.cl.unassigned2,
      [t.cd.registered]: new Date(c.created_at).toLocaleDateString(),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, t.nav.clients)

    const filename = `clientes_${new Date().toISOString().slice(0, 10)}`
    if (formato === "xlsx") {
      XLSX.writeFile(wb, `${filename}.xlsx`)
    } else {
      XLSX.writeFile(wb, `${filename}.csv`, { bookType: "csv" })
    }
    setExportando(false)
  }

  const filasPreview = filas.slice(0, 5)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{t.ie.title}</h1>
        <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">{t.ie.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Importar CSV */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Upload size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white">{t.ie.importTitle}</h2>
              <p className="text-black/40 dark:text-white/40 text-xs font-medium">{t.ie.importSub}</p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

          {archivoSeleccionado ? (
            <div className="border-2 border-blue-300 rounded-xl p-4 flex items-center justify-between bg-blue-50 mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-black">{archivoSeleccionado.name}</p>
                  <p className="text-xs font-medium text-black/40 mt-0.5">
                    {filas.length} filas · {(archivoSeleccionado.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button onClick={limpiarArchivo} className="text-black/30 hover:text-red-500 transition">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/30 mb-4 cursor-pointer transition ${
                dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <FileSpreadsheet size={32} className={`mb-2 ${dragging ? "text-blue-500" : "text-black/20"}`} />
              <p className="text-black dark:text-white font-bold text-sm">{t.ie.drop}</p>
              <p className="text-black/40 dark:text-white/40 text-xs font-medium mt-1">{t.ie.clickSelect}</p>
              <p className="text-black/30 dark:text-white/30 text-xs font-medium mt-2">{t.ie.onlyCSV}</p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700/50 rounded-xl p-3 mb-4">
            <p className="text-black dark:text-white font-bold text-xs mb-1">{t.ie.requiredCols}</p>
            <p className="text-black/60 dark:text-white/60 text-xs font-medium font-mono">nombre, email, telefono, empresa, estado</p>
          </div>

          {filas.length > 0 && (
            <button
              onClick={() => setVerPreview(!verPreview)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition mb-3"
            >
              <Eye size={13} />
              {verPreview ? t.ie.hidePreview : `${t.ie.showPreview} (${Math.min(5, filas.length)} / ${filas.length})`}
            </button>
          )}

          {verPreview && filasPreview.length > 0 && (
            <div className="overflow-x-auto mb-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    {["nombre", "email", "estado"].map(col => (
                      <th key={col} className="px-3 py-2 text-left font-black text-black/60 dark:text-white/60 uppercase">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filasPreview.map((f, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="px-3 py-1.5 font-semibold text-black dark:text-white truncate max-w-24">{f.nombre || "—"}</td>
                      <td className="px-3 py-1.5 text-black/60 dark:text-white/60 truncate max-w-28">{f.email || "—"}</td>
                      <td className="px-3 py-1.5 text-black/60 dark:text-white/60">{f.estado || "prospecto"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {msgImport && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold mb-3 ${
              msgImport.tipo === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {msgImport.tipo === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {msgImport.texto}
            </div>
          )}

          <button
            onClick={importarClientes}
            disabled={!archivoSeleccionado || importando || filas.length === 0}
            className={`w-full py-3 rounded-xl text-sm font-bold border-2 transition ${
              archivoSeleccionado && filas.length > 0
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md disabled:opacity-50"
                : "bg-gray-100 text-black/30 border-gray-200 cursor-not-allowed"
            }`}
          >
            {importando ? t.ie.importing : archivoSeleccionado ? `${t.ie.importBtn} (${filas.length})` : t.ie.selectFirst}
          </button>
        </div>

        {/* Exportar */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Download size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-black dark:text-white">{t.ie.exportTitle}</h2>
              <p className="text-black/40 dark:text-white/40 text-xs font-medium">{t.ie.exportSub}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.ie.filterStatus}</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-semibold transition"
              >
                <option value="">{t.ie.allClients}</option>
                <option value="prospecto">{t.cl.prospect}</option>
                <option value="contactado">{t.cl.contacted}</option>
                <option value="propuesta">{t.cl.proposal}</option>
                <option value="cliente">{t.cl.client}</option>
                <option value="inactivo">{t.cl.inactive}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.ie.filterSeller}</label>
              <select
                value={filtroVendedor}
                onChange={e => setFiltroVendedor(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-semibold transition"
              >
                <option value="">{t.cl.allSellers}</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro de fechas */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.ie.periodLabel}</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { key: "", label: t.ie.periodAll },
                  { key: "hoy", label: t.ie.periodToday },
                  { key: "semana", label: t.ie.periodWeek },
                  { key: "mes", label: t.ie.periodMonth },
                  { key: "trimestre", label: t.ie.periodQuarter },
                  { key: "año", label: t.ie.periodYear },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setPeriodoRapido(key); setFechaDesde(""); setFechaHasta("") }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition ${
                      periodoRapido === key && !fechaDesde && !fechaHasta
                        ? "bg-blue-600 text-white border-blue-700"
                        : "bg-white dark:bg-gray-700 text-black dark:text-white border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 block mb-1">{t.ie.from}</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={e => { setFechaDesde(e.target.value); setPeriodoRapido("") }}
                    className="w-full px-3 py-2 text-xs font-semibold text-black dark:text-white border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/50 dark:text-white/50 block mb-1">{t.ie.to}</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={e => { setFechaHasta(e.target.value); setPeriodoRapido("") }}
                    className="w-full px-3 py-2 text-xs font-semibold text-black dark:text-white border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>
              {(fechaDesde || fechaHasta || periodoRapido) && (
                <button
                  onClick={() => { setPeriodoRapido(""); setFechaDesde(""); setFechaHasta("") }}
                  className="text-xs font-bold text-black/40 hover:text-red-500 transition mt-1.5"
                >
                  × {t.ie.clearDates}
                </button>
              )}
            </div>

            <div className="pt-1 space-y-2">
              <button
                onClick={() => exportar("xlsx")}
                disabled={exportando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold border-2 border-blue-700 transition shadow-md"
              >
                <FileSpreadsheet size={16} />
                {exportando ? t.ie.exporting : t.ie.exportExcel}
              </button>
              <button
                onClick={() => exportar("csv")}
                disabled={exportando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition"
              >
                <FileText size={16} />
                {t.ie.exportCSV}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
