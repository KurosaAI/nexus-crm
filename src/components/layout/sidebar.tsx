"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Users, FileUp, Settings, ChevronLeft, ChevronRight, Zap, UserCog, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/i18n/context"

export default function Sidebar({ rol, solicitudesPendientes = 0, onClose }: { rol: string; solicitudesPendientes?: number; onClose?: () => void }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useLanguage()

  const navAdmin = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, badge: 0 },
    { href: "/dashboard/clientes", label: t.nav.clients, icon: Users, badge: 0 },
    { href: "/dashboard/empleados", label: t.nav.employees, icon: UserCog, badge: 0 },
    { href: "/dashboard/importar", label: t.nav.importExport, icon: FileUp, badge: 0 },
    { href: "/dashboard/solicitudes", label: "Administrar solicitudes", icon: ClipboardList, badge: solicitudesPendientes },
    { href: "/dashboard/configuracion", label: t.nav.settings, icon: Settings, badge: 0 },
  ]

  const navVendedor = [
    { href: "/dashboard", label: t.nav.myDashboard, icon: LayoutDashboard, badge: 0 },
    { href: "/dashboard/clientes", label: t.nav.myClients, icon: Users, badge: 0 },
    { href: "/dashboard/configuracion", label: t.nav.settings, icon: Settings, badge: 0 },
  ]

  const navItems = rol === "vendedor" ? navVendedor : navAdmin
  const rolLabel = rol === "vendedor" ? t.nav.vendedor : t.nav.admin

  return (
    <aside className={cn(
      "relative flex flex-col h-screen transition-all duration-300 flex-shrink-0 bg-white dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-700",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-5 py-5 border-b-2 border-gray-200 dark:border-gray-700",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-black dark:text-white text-base tracking-tight">Nexus CRM</span>
            <p className="text-blue-600 text-[10px] font-bold tracking-widest uppercase">{rolLabel}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-1">
        {!collapsed && (
          <p className="text-black/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">
            {t.nav.menu}
          </p>
        )}
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl transition-all duration-200 font-semibold text-sm border",
                collapsed ? "justify-center h-11 w-11 mx-auto" : "px-3 h-11",
                active
                  ? "bg-blue-600 text-white border-blue-700 shadow-md"
                  : "text-black dark:text-white border-transparent hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-700"
              )}
            >
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-white dark:border-gray-900" />
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  {label}
                  {badge > 0 && (
                    <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {badge}
                    </span>
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 pb-5">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700/50 p-3">
            <p className="text-black dark:text-white font-bold text-xs">{t.nav.freePlan}</p>
            <p className="text-black/50 dark:text-white/50 text-[11px] mt-0.5">{t.nav.upTo}</p>
            <div className="mt-2 h-2 rounded-full bg-blue-200 dark:bg-blue-800">
              <div className="h-full w-1/5 rounded-full bg-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-20 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-black dark:text-white hover:border-blue-400 hover:text-blue-600 transition-colors z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
