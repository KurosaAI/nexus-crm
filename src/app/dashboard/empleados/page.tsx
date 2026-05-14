import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EmpleadosClient from "./empleados-client"

export default async function EmpleadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: empleados }, { data: clientesCounts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, usuario, codigo_acceso, activo, estado_empleado, created_at")
      .eq("rol", "vendedor")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("clientes")
      .select("vendedor_id, vendedor_original_id")
      .eq("admin_id", user.id),
  ])

  const countMap: Record<string, number> = {}
  const prestadosMap: Record<string, number> = {}
  clientesCounts?.forEach(c => {
    if (c.vendedor_id) countMap[c.vendedor_id] = (countMap[c.vendedor_id] || 0) + 1
    if (c.vendedor_original_id) prestadosMap[c.vendedor_original_id] = (prestadosMap[c.vendedor_original_id] || 0) + 1
  })

  const empleadosConCount = (empleados ?? []).map(e => ({
    ...e,
    clientesAsignados: countMap[e.id] || 0,
    clientesPrestados: prestadosMap[e.id] || 0,
  }))

  return <EmpleadosClient empleados={empleadosConCount} />
}
