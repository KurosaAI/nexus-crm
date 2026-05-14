"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { useLanguage } from "@/i18n/context"
import { createClient } from "@/lib/supabase/client"
import { ESTADO_KEYS } from "@/lib/supabase/types"

export default function NuevoClientePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [estado, setEstado] = useState("prospecto")
  const [vendedorId, setVendedorId] = useState("")
  const [notasRapidas, setNotasRapidas] = useState("")
  const [vendedores, setVendedores] = useState<{ id: string; nombre: string }[]>([])
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null)

  const estadoLabels: Record<string, string> = {
    prospecto: t.cl.prospect,
    contactado: t.cl.contacted,
    propuesta: t.cl.proposal,
    cliente: t.cl.client,
    inactivo: t.cl.inactive,
  }

  useEffect(() => {
    async function cargarVendedores() {
      const { data } = await supabase.from("profiles").select("id, nombre").eq("rol", "vendedor")
      setVendedores(data ?? [])
    }
    cargarVendedores()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setGuardando(true)
    setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")
      const { data: clienteCreado, error } = await supabase.from("clientes").insert({
        nombre: nombre.trim(),
        empresa: empresa.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        estado,
        vendedor_id: vendedorId || null,
        notas_rapidas: notasRapidas.trim() || null,
        admin_id: user.id,
      }).select("id").single()
      if (error) throw error

      if (email.trim() && clienteCreado) {
        fetch("/api/email/plantilla", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "bienvenida", clienteId: clienteCreado.id }),
        })
      }

      router.push("/dashboard/clientes")
      router.refresh()
    } catch {
      setMsg({ tipo: "err", texto: t.st.saveError })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clientes"
          className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-black dark:text-white hover:border-blue-400 hover:text-blue-600 transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{t.nc.title}</h1>
          <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">{t.nc.subtitle}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.fullName}</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Juan Pérez" required
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition" />
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.company}</label>
              <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
                placeholder="Empresa S.A."
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition" />
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@empresa.com"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition" />
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.phone}</label>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="+1 809 000 0000"
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition" />
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.status}</label>
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-semibold transition">
                {ESTADO_KEYS.map(k => <option key={k} value={k}>{estadoLabels[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.assignedSeller}</label>
              <select value={vendedorId} onChange={e => setVendedorId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white font-semibold transition">
                <option value="">{t.nc.unassigned}</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.nc.notes}</label>
            <textarea rows={3} value={notasRapidas} onChange={e => setNotasRapidas(e.target.value)}
              placeholder={t.nc.notesPlaceholder}
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition resize-none" />
          </div>

          {msg && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold ${
              msg.tipo === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {msg.tipo === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {msg.texto}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={guardando || !nombre.trim()}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold border-2 border-blue-700 transition shadow-md">
              {guardando ? t.st.saving : t.nc.save}
            </button>
            <Link href="/dashboard/clientes"
              className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition text-center">
              {t.nc.cancel}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
