#!/usr/bin/env node
// Valida que todas las variables de entorno necesarias estén configuradas
// Uso: npm run check

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const optional = ["RESEND_API_KEY"]

require("dotenv").config({ path: ".env.local" })

let ok = true

console.log("\n🔍 Nexus CRM — Verificación de entorno\n")

for (const key of required) {
  const val = process.env[key]
  if (!val || val.includes("...") || val.startsWith("tu-") || val.startsWith("<")) {
    console.error(`  ✗  ${key} — falta o tiene valor de ejemplo`)
    ok = false
  } else {
    console.log(`  ✓  ${key}`)
  }
}

for (const key of optional) {
  const val = process.env[key]
  if (!val || val.includes("...")) {
    console.warn(`  ⚠  ${key} — no configurado (emails desactivados)`)
  } else {
    console.log(`  ✓  ${key}`)
  }
}

if (!ok) {
  console.error("\n❌ Faltan variables obligatorias. Revisa tu .env.local\n")
  process.exit(1)
}

// Verificar conexión con Supabase
const { createClient } = require("@supabase/supabase-js")
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

supabase.from("profiles").select("id").limit(1).then(({ error }) => {
  if (error) {
    console.error(`\n❌ No se pudo conectar a Supabase: ${error.message}`)
    console.error("   Verifica que el schema.sql haya sido ejecutado.\n")
    process.exit(1)
  }
  console.log("\n✅ Todo listo. Ejecuta: npm run dev\n")
}).catch(() => {
  console.error("\n❌ Error de conexión. Verifica NEXT_PUBLIC_SUPABASE_URL.\n")
  process.exit(1)
})
