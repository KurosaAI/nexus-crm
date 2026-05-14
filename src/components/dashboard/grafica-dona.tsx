"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { useLanguage } from "@/i18n/context"

const COLORES: Record<string, string> = {
  prospecto: "#9ca3af",
  contactado: "#0ea5e9",
  propuesta: "#6366f1",
  cliente: "#2563eb",
  inactivo: "#f43f5e",
}

interface Props {
  estadoCounts: Record<string, number>
}

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl px-3 py-2 shadow-md">
        <p className="text-black font-bold text-xs">{payload[0].name}</p>
        <p className="text-blue-600 font-black text-sm mt-0.5">{payload[0].value} clientes</p>
      </div>
    )
  }
  return null
}

export default function GraficaDona({ estadoCounts }: Props) {
  const { t } = useLanguage()

  const etiquetas: Record<string, string> = {
    prospecto: t.cl.prospect,
    contactado: t.cl.contacted,
    propuesta: t.cl.proposal,
    cliente: t.cl.client,
    inactivo: t.cl.inactive,
  }

  const data = Object.entries(estadoCounts)
    .filter(([, v]) => v > 0)
    .map(([estado, value]) => ({
      name: etiquetas[estado] ?? estado,
      value,
      color: COLORES[estado] ?? "#9ca3af",
    }))

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <p className="text-black/30 text-xs font-semibold">{t.da.noActivity}</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5 mt-2">
        {data.map(({ name, value, color }) => (
          <div key={name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs font-bold text-black">{name}</span>
            </div>
            <span className="text-xs font-black text-black">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
