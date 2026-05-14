"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="border-slate-600 text-slate-300 hover:bg-slate-800 gap-2"
    >
      <LogOut size={16} />
      Cerrar sesión
    </Button>
  )
}
