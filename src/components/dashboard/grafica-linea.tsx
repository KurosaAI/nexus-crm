"use client"

import { useState, useRef, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar } from "lucide-react"
import { useLanguage } from "@/i18n/context"

type Periodo = "7D" | "30D" | "3M" | "12M"

interface Props {
  datosPorPeriodo: Record<string, { label: string; clientes: number }[]>
}

interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string }

function CustomTooltip({ active, payload, label }: TooltipProps) {
  const { t } = useLanguage()
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl px-3 py-2 shadow-md">
        <p className="text-black font-bold text-xs">{label}</p>
        <p className="text-blue-600 font-black text-sm mt-0.5">{payload[0].value} {t.da.clients}</p>
      </div>
    )
  }
  return null
}

export default function GraficaLinea({ datosPorPeriodo }: Props) {
  const { t } = useLanguage()
  const [periodo, setPeriodo] = useState<Periodo>("12M")
  const [showCustom, setShowCustom] = useState(false)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const customRef = useRef<HTMLDivElement>(null)

  const periodos: { key: Periodo; label: string }[] = [
    { key: "7D", label: "7D" },
    { key: "30D", label: "30D" },
    { key: "3M", label: "3M" },
    { key: "12M", label: "12M" },
  ]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customRef.current && !customRef.current.contains(e.target as Node)) setShowCustom(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const data = datosPorPeriodo[periodo] ?? []

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-4 items-center">
        {periodos.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setPeriodo(key); setShowCustom(false) }}
            className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition ${
              periodo === key ? "bg-blue-600 text-white border-blue-700" : "bg-white text-black border-gray-200 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {label}
          </button>
        ))}

        <div className="relative" ref={customRef}>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border-2 transition bg-white text-black border-gray-200 hover:border-blue-400 hover:text-blue-600"
          >
            <Calendar size={12} />
            {t.da.custom}
          </button>
          {showCustom && (
            <div className="absolute top-9 left-0 z-20 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 w-64">
              <p className="text-black font-bold text-xs mb-3">{t.da.customRange}</p>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-bold text-black/60 block mb-1">{t.da.from}</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-black border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 block mb-1">{t.da.to}</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-black border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" />
                </div>
                <button onClick={() => setShowCustom(false)} disabled={!fechaInicio || !fechaFin}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold border-2 border-blue-700 disabled:border-gray-200 transition">
                  {t.da.apply}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#000", fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
          <YAxis tick={{ fill: "#000", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="clientes" stroke="#2563eb" strokeWidth={3}
            dot={{ fill: "#2563eb", strokeWidth: 2, r: 4, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={400} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
