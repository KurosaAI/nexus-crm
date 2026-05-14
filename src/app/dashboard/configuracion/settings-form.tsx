"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Lock, Bell, Shield, CheckCircle2, AlertCircle } from "lucide-react"
import { useLanguage } from "@/i18n/context"
import PlantillasEmail from "./plantillas-email"

interface Props {
  nombre: string
  email: string
  rol: "admin" | "vendedor"
  plantillas: any[]
}

export default function SettingsForm({ nombre, email, rol, plantillas }: Props) {
  const { t } = useLanguage()
  const supabase = createClient()

  const [nuevoNombre, setNuevoNombre] = useState(nombre)
  const [perfilMsg, setPerfilMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  const [passActual, setPassActual] = useState("")
  const [passNueva, setPassNueva] = useState("")
  const [passConfirm, setPassConfirm] = useState("")
  const [passMsg, setPassMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null)
  const [guardandoPass, setGuardandoPass] = useState(false)

  async function guardarPerfil() {
    setGuardandoPerfil(true)
    setPerfilMsg(null)
    try {
      const { error } = await supabase.auth.updateUser({ data: { nombre: nuevoNombre } })
      if (error) throw error
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").update({ nombre: nuevoNombre }).eq("id", user.id)
      }
      setPerfilMsg({ tipo: "ok", texto: t.st.nameSaved })
    } catch {
      setPerfilMsg({ tipo: "err", texto: t.st.saveError })
    } finally {
      setGuardandoPerfil(false)
    }
  }

  async function cambiarPassword() {
    if (passNueva !== passConfirm) {
      setPassMsg({ tipo: "err", texto: t.st.passMismatch })
      return
    }
    if (passNueva.length < 6) {
      setPassMsg({ tipo: "err", texto: t.st.passShort })
      return
    }
    setGuardandoPass(true)
    setPassMsg(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passActual })
      if (signInError) {
        setPassMsg({ tipo: "err", texto: t.st.wrongPass })
        return
      }
      const { error } = await supabase.auth.updateUser({ password: passNueva })
      if (error) throw error
      setPassMsg({ tipo: "ok", texto: t.st.passUpdated })
      setPassActual("")
      setPassNueva("")
      setPassConfirm("")
    } catch {
      setPassMsg({ tipo: "err", texto: t.st.passError })
    } finally {
      setGuardandoPass(false)
    }
  }

  const notificaciones = [
    { label: t.st.notif1, desc: t.st.notif1d },
    { label: t.st.notif2, desc: t.st.notif2d },
    { label: t.st.notif3, desc: t.st.notif3d },
  ]
  const [notifState, setNotifState] = useState([true, true, false])

  function Mensaje({ msg }: { msg: { tipo: "ok" | "err"; texto: string } }) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold mt-3 ${
        msg.tipo === "ok"
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-red-50 border-red-200 text-red-600"
      }`}>
        {msg.tipo === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
        {msg.texto}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{t.st.title}</h1>
        <p className="text-black/40 dark:text-white/40 text-sm mt-0.5 font-medium">{t.st.subtitle}</p>
      </div>

      {/* Perfil */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">{t.st.personalInfo}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.st.fullName}</label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder={t.st.fullName}
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.st.email}</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-black/40 dark:text-white/40 font-medium cursor-not-allowed"
            />
            <p className="text-black/30 dark:text-white/30 text-xs font-medium mt-1">{t.st.emailNote}</p>
          </div>
        </div>
        {perfilMsg && <Mensaje msg={perfilMsg} />}
        <button
          onClick={guardarPerfil}
          disabled={guardandoPerfil || nuevoNombre === nombre}
          className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold border-2 border-blue-700 transition shadow-md"
        >
          {guardandoPerfil ? t.st.saving : t.st.save}
        </button>
      </div>

      {/* Contraseña — solo admin */}
      {rol === "admin" && <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-200">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Lock size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">{t.st.changePass}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.st.currentPass}</label>
            <input
              type="password"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.st.newPass}</label>
            <input
              type="password"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black dark:text-white mb-1.5">{t.st.confirmPass}</label>
            <input
              type="password"
              value={passConfirm}
              onChange={(e) => setPassConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 font-medium transition"
            />
          </div>
        </div>
        {passMsg && <Mensaje msg={passMsg} />}
        <button
          onClick={cambiarPassword}
          disabled={guardandoPass || !passActual || !passNueva || !passConfirm}
          className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold border-2 border-blue-700 transition shadow-md"
        >
          {guardandoPass ? t.st.updating : t.st.update}
        </button>
      </div>}

      {/* Notificaciones */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Bell size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">{t.st.notifications}</h2>
        </div>
        <div className="space-y-3">
          {notificaciones.map(({ label, desc }, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
              <div>
                <p className="text-sm font-bold text-black dark:text-white">{label}</p>
                <p className="text-xs font-medium text-black/40 dark:text-white/40 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => {
                  const next = [...notifState]
                  next[i] = !next[i]
                  setNotifState(next)
                }}
                className={`w-11 h-6 rounded-full border-2 relative cursor-pointer flex-shrink-0 transition-colors ${
                  notifState[i] ? "bg-blue-600 border-blue-700" : "bg-gray-200 border-gray-300"
                }`}
              >
                <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${
                  notifState[i] ? "right-1" : "left-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Plantillas de email — solo admin */}
      {rol === "admin" && <PlantillasEmail plantillasIniciales={plantillas} />}

      {/* Zona de peligro — solo admin */}
      {rol === "admin" && <div className="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-red-100 dark:border-red-900/30">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">{t.st.dangerZone}</h2>
        </div>
        <p className="text-black/50 dark:text-white/50 text-xs font-medium mb-3">{t.st.dangerDesc}</p>
        <button className="px-5 py-2.5 rounded-xl border-2 border-red-300 text-red-500 text-sm font-bold hover:bg-red-50 transition">
          {t.st.deleteAccount}
        </button>
      </div>}
    </div>
  )
}
