"use client"

import { useState } from "react"
import Sidebar from "./sidebar"
import Topbar from "./topbar"
import type { User } from "@supabase/supabase-js"

interface Props {
  children: React.ReactNode
  user: User
  rol: string
  solicitudesPendientes: number
}

export default function DashboardShell({ children, user, rol, solicitudesPendientes }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 lg:relative lg:translate-x-0 transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          rol={rol}
          solicitudesPendientes={solicitudesPendientes}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar
          user={user}
          rol={rol}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
