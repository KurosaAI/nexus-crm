"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shield, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { useLanguage } from "@/i18n/context"

export default function NuevoEmpleadoPage() {
  const { t } = useLanguage()
  const router = useRouter()

  const [nombre, setNombre] = useState("")
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [codigoAcceso, setCodigoAcceso] = useState("")
  const [verPassword, setVerPassword] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !usuario || !password || !codigoAcceso) {
      setMsg({ tipo: "err", texto: t.ne.allFieldsRequired })
      return
    }
    if (password.length < 6) {
      setMsg({ tipo: "err", texto: t.st.passShort })
      return
    }
    setGuardando(true)
    setMsg(null)
    try {
      const res = await fetch("/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, usuario, password, codigoAcceso }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ tipo: "err", texto: data.error ?? t.ne.createError })
      } else {
        setMsg({ tipo: "ok", texto: t.ne.createSuccess })
        setTimeout(() => router.push("/dashboard/empleados"), 1200)
      }
    } catch {
      setMsg({ tipo: "err", texto: t.ne.connectionError })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/empleados"
          className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-black dark:text-white hover:border-blue-400 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{t.ne.title}</h1>
          <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">{t.ne.subtitle}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.ne.fullName}</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="María González"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.ne.username}</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="mariagonzalez"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
            <p className="text-black/40 dark:text-white/40 text-xs font-medium mt-1">{t.ne.usernameHint}</p>
          </div>

          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.ne.password}</label>
            <div className="relative">
              <input
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.auth.passMinHint}
                className="w-full px-4 py-2.5 pr-11 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition"
              >
                {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-black/40 dark:text-white/40 text-xs font-medium mt-1">{t.ne.ownerPasswordNote}</p>
          </div>

          <div>
            <label className="block text-xs font-black text-black mb-1.5 flex items-center gap-1.5">
              <Shield size={12} className="text-blue-600" />
              {t.ne.accessCode}
            </label>
            <input
              type="text"
              value={codigoAcceso}
              onChange={e => setCodigoAcceso(e.target.value.toUpperCase())}
              placeholder="VND-001"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-blue-200 dark:border-blue-700/50 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
            <p className="text-black/40 dark:text-white/40 text-xs font-medium mt-1">{t.ne.accessCodeHint}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700/50 rounded-xl p-3">
            <p className="text-black dark:text-white font-bold text-xs mb-1">{t.ne.howTitle}</p>
            <p className="text-black/60 dark:text-white/60 text-xs font-medium leading-relaxed">{t.ne.howDesc}</p>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold ${
              msg.tipo === "ok"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {msg.tipo === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {msg.texto}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold border-2 border-blue-700 transition shadow-md"
            >
              {guardando ? t.ne.creating : t.ne.create}
            </button>
            <Link
              href="/dashboard/empleados"
              className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-black dark:text-white text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition text-center"
            >
              {t.ne.cancel}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
