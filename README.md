# Nexus CRM

CRM completo para gestión de clientes y equipo de ventas. Construido con Next.js 16, Tailwind CSS v4 y Supabase.

## Funcionalidades

- **Gestión de clientes** — CRUD completo con pipeline de estados, notas, historial y ficha PDF
- **Equipo de vendedores** — Sistema de estados (Activo / Pausado / Restringido / En aviso / Despedido) con redistribución automática de clientes
- **Asignación masiva** — Selección múltiple con distribución equitativa entre empleados
- **Importar / Exportar** — CSV con vista previa y Excel con filtros de fecha
- **Dashboard** — KPIs, gráfica de línea y gráfica de dona con datos reales
- **Emails automáticos** — Bienvenida y notificaciones por cambio de estado (Brevo, 300/día gratis)
- **12 idiomas** — Selector de idioma en el panel
- **Dos roles** — Admin (vista global) y Vendedor (solo sus clientes)

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) | Framework principal |
| Tailwind CSS v4 | Estilos |
| Supabase | Base de datos PostgreSQL + Auth |
| Recharts | Gráficas del dashboard |
| SheetJS (xlsx) | Exportar a Excel |
| PapaParse | Importar CSV |
| jsPDF | Generar fichas PDF |
| Brevo | Emails automáticos (300/día gratis) |
| react-hot-toast | Notificaciones |

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nexus-crm.git
cd nexus-crm
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto (elige la región más cercana)
3. Espera a que el proyecto se inicialice (~1 minuto)

### 3. Ejecutar el schema de base de datos

1. En Supabase, ve a **SQL Editor → New query**
2. Copia el contenido de `supabase/schema.sql`
3. Pégalo y presiona **Run**
4. Deberías ver "Success. No rows returned"

### 4. Cargar datos de ejemplo (opcional)

1. En **SQL Editor**, abre `supabase/seed.sql`
2. Reemplaza `<TU_ADMIN_ID>` con tu UUID de usuario (Authentication → Users)
3. Ejecuta el script

### 5. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus claves de Supabase (Settings → API):
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (mantener privada)

Para emails automáticos (opcional):
- `BREVO_API_KEY` — Crea cuenta gratuita en [brevo.com](https://brevo.com) → SMTP y API → Claves API

### 6. Verificar configuración

```bash
npm run check
```

Si todo está correcto verás: `✅ Todo listo. Ejecuta: npm run dev`

### 7. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 8. Crear tu cuenta admin

1. Ve a `/login` y registra tu cuenta
2. Tu perfil se crea automáticamente como **admin**
3. Desde el panel puedes crear empleados (vendedores) y clientes

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── dashboard/
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── clientes/          # Lista y perfil de clientes
│   │   ├── empleados/         # Gestión del equipo
│   │   └── importar/          # Importar CSV / Exportar Excel
│   └── api/                   # API routes
├── components/
│   ├── dashboard/             # Gráficas y KPIs
│   └── layout/                # Sidebar y topbar
├── i18n/                      # Traducciones (12 idiomas)
└── lib/supabase/              # Cliente Supabase y tipos
supabase/
├── schema.sql                 # Schema completo de la BD
└── seed.sql                   # Datos de ejemplo
```

## Deploy en Vercel (demo online)

1. Sube el proyecto a GitHub
2. Conecta el repo en [vercel.com](https://vercel.com)
3. En Vercel → Settings → Environment Variables, agrega las mismas variables de `.env.local`
4. Despliega — tu CRM queda online 24/7

## Licencia

MIT — libre para uso personal y comercial.
