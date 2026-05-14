"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, Search, LogOut, User, Plus, X, Globe, Sun, Moon, Menu } from "lucide-react"
import Link from "next/link"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useLanguage } from "@/i18n/context"
import { LANGUAGES, type Lang } from "@/i18n/translations"
import { useTheme } from "next-themes"

export default function Topbar({ user, rol, onMenuClick }: { user: SupabaseUser; rol: string; onMenuClick?: () => void }) {
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const { theme, setTheme } = useTheme()
  const nombre = (user.user_metadata?.nombre as string) || user.email || "Usuario"
  const initials = nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()

  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<{ id: string; tipo: string; mensaje: string; leida: boolean; created_at: string; referencia_id?: string | null }[]>([])
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  const noLeidas = notificaciones.filter(n => !n.leida).length

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/notificaciones")
      .then(r => r.json())
      .then(d => setNotificaciones(d.notificaciones ?? []))
      .catch(() => {})
  }, [])

  async function marcarLeidas() {
    await fetch("/api/notificaciones", { method: "PATCH" })
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const rolLabel = rol === "vendedor" ? t.nav.vendedor : t.nav.admin

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 gap-4 flex-shrink-0">
      {/* Hamburger móvil */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-black dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 transition flex-shrink-0"
      >
        <Menu size={18} />
      </button>

      {/* Buscador */}
      <div className="relative w-full max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
        <input
          type="text"
          placeholder={t.topbar.search}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 transition font-medium"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Nuevo cliente */}
        <Link
          href="/dashboard/clientes/nuevo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-2 border-blue-700 transition shadow-sm whitespace-nowrap"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">{t.topbar.newClient}</span>
        </Link>

        {/* Toggle dark/light */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-black dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
          title={mounted ? (theme === "dark" ? "Modo claro" : "Modo oscuro") : "Tema"}
        >
          {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
        </button>

        {/* Selector de idioma */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserMenuOpen(false) }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-black dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 transition text-xs font-bold"
            title={t.topbar.language}
          >
            <Globe size={16} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b-2 border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-black dark:text-white">{t.topbar.language}</p>
              </div>
              <div className="p-1 max-h-72 overflow-y-auto">
                {(Object.keys(LANGUAGES) as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition text-left ${
                      lang === l ? "bg-blue-600 text-white" : "text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700"
                    }`}
                  >
                    <span className="text-base">{LANGUAGES[l].flag}</span>
                    {LANGUAGES[l].name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); setLangOpen(false) }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-black dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <Bell size={17} />
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-blue-600 border-2 border-white text-white text-[9px] font-black flex items-center justify-center px-0.5">
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-black dark:text-white">{t.topbar.notifications}</p>
                  {noLeidas > 0 && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-black">{noLeidas}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {noLeidas > 0 && (
                    <button onClick={marcarLeidas} className="text-[10px] text-blue-600 font-bold hover:underline">
                      {t.topbar.markAllRead}
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-black/40 hover:text-black transition">
                    <X size={14} />
                  </button>
                </div>
              </div>
              {notificaciones.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <Bell size={24} className="text-black/10" />
                  <p className="text-black/40 dark:text-white/40 text-xs font-semibold">{t.topbar.noNotifications}</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y-2 divide-gray-100">
                  {notificaciones.map(n => {
                    const href = n.referencia_id ? `/dashboard/clientes/${n.referencia_id}` : "/dashboard"
                    return (
                      <Link key={n.id} href={href} onClick={() => setNotifOpen(false)}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition cursor-pointer ${!n.leida ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.leida ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-black dark:text-white leading-relaxed">{n.mensaje}</p>
                          <p className="text-[10px] text-black/30 font-medium mt-0.5">
                            {new Date(n.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Menú de usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); setLangOpen(false) }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-black dark:text-white leading-none">{nombre.split(" ")[0]}</p>
              <p className="text-[11px] text-black/50 dark:text-white/50 mt-0.5 leading-none font-semibold capitalize">{rolLabel}</p>
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b-2 border-gray-200 dark:border-gray-700">
                <p className="text-xs text-black/40 dark:text-white/40 font-medium truncate">{user.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { router.push("/dashboard/configuracion"); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 transition text-left"
                >
                  <User size={14} />
                  {t.topbar.myProfile}
                </button>
              </div>
              <div className="p-1 border-t-2 border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left"
                >
                  <LogOut size={14} />
                  {t.topbar.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
