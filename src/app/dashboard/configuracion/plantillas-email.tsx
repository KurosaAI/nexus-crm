"use client"

import { useState } from "react"
import { Mail, Sparkles, Save, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/i18n/context"

interface Plantilla {
  id?: string
  tipo: string
  asunto: string
  cuerpo: string
  activa: boolean
  dias_sin_actividad?: number
}

interface Props {
  plantillasIniciales: Plantilla[]
}

const VARIABLES = ["[nombre]", "[vendedor]", "[empresa]", "[estado]", "[dias]"]
const TIPO_KEYS = ["bienvenida", "seguimiento", "contactado", "propuesta", "cliente", "inactivo"]
const TIPO_COLORS: Record<string, string> = {
  bienvenida: "bg-green-50 border-green-200 text-green-700",
  seguimiento: "bg-yellow-50 border-yellow-200 text-yellow-700",
  contactado: "bg-blue-50 border-blue-200 text-blue-700",
  propuesta: "bg-purple-50 border-purple-200 text-purple-700",
  cliente: "bg-emerald-50 border-emerald-200 text-emerald-700",
  inactivo: "bg-gray-100 border-gray-200 text-gray-600",
}

export default function PlantillasEmail({ plantillasIniciales }: Props) {
  const { t } = useLanguage()
  const supabase = createClient()

  const [plantillas, setPlantillas] = useState<Record<string, Plantilla>>(() => {
    const map: Record<string, Plantilla> = {}
    TIPO_KEYS.forEach(key => {
      const existente = plantillasIniciales.find(p => p.tipo === key)
      map[key] = existente ?? { tipo: key, asunto: "", cuerpo: "", activa: true, dias_sin_actividad: 7 }
    })
    return map
  })

  const [expandido, setExpandido] = useState<string | null>("bienvenida")
  const [mejorando, setMejorando] = useState<string | null>(null)
  const [guardando, setGuardando] = useState<string | null>(null)

  const tipoLabels: Record<string, string> = {
    bienvenida: t.st.typeBienvenida,
    seguimiento: t.st.typeSeguimiento,
    contactado: t.st.typeContactado,
    propuesta: t.st.typePropuesta,
    cliente: t.st.typeCliente,
    inactivo: t.st.typeInactivo,
  }
  const tipoDescs: Record<string, string> = {
    bienvenida: t.st.descBienvenida,
    seguimiento: t.st.descSeguimiento,
    contactado: t.st.descContactado,
    propuesta: t.st.descPropuesta,
    cliente: t.st.descCliente,
    inactivo: t.st.descInactivo,
  }

  function actualizar(tipo: string, campo: keyof Plantilla, valor: any) {
    setPlantillas(prev => ({ ...prev, [tipo]: { ...prev[tipo], [campo]: valor } }))
  }

  function insertarVariable(tipo: string, variable: string) {
    setPlantillas(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], cuerpo: prev[tipo].cuerpo + variable }
    }))
  }

  async function mejorarConIA(tipo: string) {
    const p = plantillas[tipo]
    if (!p.cuerpo.trim()) {
      toast.error(t.st.writeFirst)
      return
    }
    setMejorando(tipo)
    try {
      const res = await fetch("/api/ia/mejorar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: p.cuerpo, tipo, asunto: p.asunto }),
      })
      const data = await res.json()
      if (data.mejorado) {
        actualizar(tipo, "cuerpo", data.mejorado)
        toast.success(t.st.improvedSuccess)
      } else {
        toast.error(t.st.improvedError)
      }
    } catch {
      toast.error(t.st.improvedError)
    }
    setMejorando(null)
  }

  async function guardar(tipo: string) {
    const p = plantillas[tipo]
    if (!p.asunto.trim() || !p.cuerpo.trim()) {
      toast.error(t.st.subjectRequired)
      return
    }
    setGuardando(tipo)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      admin_id: user.id,
      tipo,
      asunto: p.asunto,
      cuerpo: p.cuerpo,
      activa: p.activa,
      dias_sin_actividad: p.dias_sin_actividad ?? 7,
    }

    const { data, error } = await supabase
      .from("plantillas_email")
      .upsert(payload, { onConflict: "admin_id,tipo" })
      .select()
      .single()

    if (error) {
      toast.error(t.st.templateError)
    } else {
      if (data) setPlantillas(prev => ({ ...prev, [tipo]: data as Plantilla }))
      toast.success(t.st.templateSaved)
    }
    setGuardando(null)
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-200">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <Mail size={16} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-black">{t.st.emailTemplates}</h2>
          <p className="text-xs font-medium text-black/40 mt-0.5">{t.st.emailTemplatesDesc}</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <p className="text-xs font-semibold text-blue-700">{t.st.variablesNote}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {VARIABLES.map(v => (
            <span key={v} className="px-2 py-0.5 bg-white border border-blue-300 rounded-md text-xs font-bold text-blue-600">{v}</span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {TIPO_KEYS.map(key => {
          const p = plantillas[key]
          const abierto = expandido === key
          const label = tipoLabels[key] ?? key
          const desc = tipoDescs[key] ?? ""
          const color = TIPO_COLORS[key] ?? ""
          return (
            <div key={key} className={`border-2 rounded-xl overflow-hidden transition-all ${p.activa ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              <button
                onClick={() => setExpandido(abierto ? null : key)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${color}`}>{label}</span>
                  <span className="text-xs font-medium text-black/40 hidden sm:block">{desc}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    role="switch"
                    aria-checked={p.activa}
                    onClick={e => { e.stopPropagation(); actualizar(key, "activa", !p.activa) }}
                    className={`text-xs font-bold flex items-center gap-1 transition cursor-pointer ${p.activa ? "text-green-600" : "text-black/30"}`}
                  >
                    {p.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </div>
                  {abierto ? <ChevronUp size={16} className="text-black/30" /> : <ChevronDown size={16} className="text-black/30" />}
                </div>
              </button>

              {abierto && (
                <div className="px-4 pb-4 space-y-3 border-t-2 border-gray-100 pt-4">
                  {key === "seguimiento" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-black text-black whitespace-nowrap">{t.st.sendAfter}</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={p.dias_sin_actividad ?? 7}
                        onChange={e => actualizar(key, "dias_sin_actividad", parseInt(e.target.value))}
                        className="w-20 px-3 py-1.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-black font-bold transition"
                      />
                      <label className="text-xs font-black text-black">{t.st.daysWithout}</label>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-black mb-1.5">{t.st.emailSubjectLabel}</label>
                    <input
                      type="text"
                      value={p.asunto}
                      onChange={e => actualizar(key, "asunto", e.target.value)}
                      placeholder="Ej: Bienvenido al equipo, [nombre]"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-black placeholder-black/30 font-medium transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-black">{t.st.emailBodyLabel}</label>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {VARIABLES.map(v => (
                          <button key={v} onClick={() => insertarVariable(key, v)}
                            className="px-1.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition">
                            +{v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={p.cuerpo}
                      onChange={e => actualizar(key, "cuerpo", e.target.value)}
                      placeholder={`Hola [nombre], ...`}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-black placeholder-black/30 font-medium transition resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => mejorarConIA(key)}
                      disabled={mejorando === key}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-purple-300 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 hover:border-purple-400 disabled:opacity-50 transition"
                    >
                      <Sparkles size={13} />
                      {mejorando === key ? t.st.improving : t.st.improveWithAI}
                    </button>
                    <button
                      onClick={() => guardar(key)}
                      disabled={guardando === key}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold border-2 border-blue-700 transition shadow-md"
                    >
                      <Save size={13} />
                      {guardando === key ? t.st.saving : t.st.saveTemplate}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
