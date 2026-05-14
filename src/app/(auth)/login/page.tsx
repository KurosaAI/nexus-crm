"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2, Shield } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import { useLanguage } from "@/i18n/context"

export default function LoginPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [codigoAcceso, setCodigoAcceso] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isEmployee = !identifier.includes("@") && identifier.length > 0

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const emailToUse = identifier.includes("@")
      ? identifier
      : `${identifier}@nexuscrm.internal`

    const { error, data } = await supabase.auth.signInWithPassword({ email: emailToUse, password })

    if (error) {
      toast.error(t.auth.loginError)
      setLoading(false)
      return
    }

    // Empleados deben verificar su código de acceso
    if (!identifier.includes("@")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("codigo_acceso")
        .eq("id", data.user.id)
        .single()

      if (!profile || profile.codigo_acceso !== codigoAcceso.toUpperCase()) {
        await supabase.auth.signOut()
        toast.error(t.auth.accessCodeError)
        setLoading(false)
        return
      }
    }

    toast.success(t.auth.welcome)
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Toaster position="top-right" />

      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Nexus CRM</h1>
          <p className="text-slate-400 mt-1">{t.auth.loginTitle}</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.auth.emailOrUsername}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trim())}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.auth.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isEmployee && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Shield size={14} className="text-indigo-400" />
                  {t.auth.accessCode}
                </label>
                <input
                  type="text"
                  value={codigoAcceso}
                  onChange={(e) => setCodigoAcceso(e.target.value.toUpperCase())}
                  required
                  placeholder="VND-001"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-indigo-500/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono tracking-widest"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {t.auth.loggingIn}
                </span>
              ) : (
                t.auth.loginBtn
              )}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {t.auth.noAccount}{" "}
            <Link href="/registro" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              {t.auth.registerFree}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
