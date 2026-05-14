-- Ejecutar en Supabase → SQL Editor
-- Tabla para guardar plantillas de email del admin

create table if not exists public.plantillas_email (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete cascade not null,
  tipo text not null check (tipo in ('bienvenida','seguimiento','prospecto','contactado','propuesta','cliente','inactivo','empleado')),
  asunto text not null default '',
  cuerpo text not null default '',
  activa boolean not null default true,
  dias_sin_actividad int default 7, -- solo para tipo 'seguimiento'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(admin_id, tipo)
);

alter table public.plantillas_email enable row level security;

create policy "admin gestiona sus plantillas" on public.plantillas_email
  for all using (admin_id = auth.uid());

-- Trigger updated_at
create trigger set_plantillas_updated_at
  before update on public.plantillas_email
  for each row execute procedure public.set_updated_at();
