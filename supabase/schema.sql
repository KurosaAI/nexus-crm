-- ============================================================
-- NEXUS CRM - Schema completo
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. PROFILES (extiende auth.users de Supabase)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  usuario text,
  rol text not null default 'admin' check (rol in ('admin', 'vendedor')),
  codigo_acceso text,
  estado_empleado text not null default 'activo'
    check (estado_empleado in ('activo','pausado','restringido','en_aviso','inactivo')),
  admin_id uuid references public.profiles(id) on delete set null,
  activo boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 2. CLIENTES
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  telefono text,
  empresa text,
  estado text not null default 'prospecto'
    check (estado in ('prospecto','contactado','propuesta','cliente','inactivo')),
  notas_rapidas text,
  vendedor_id uuid references public.profiles(id) on delete set null,
  vendedor_original_id uuid references public.profiles(id) on delete set null,
  admin_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. ETIQUETAS
create table if not exists public.etiquetas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color text not null default '#3b82f6',
  admin_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

-- 4. CLIENTE_ETIQUETAS (relación muchos a muchos)
create table if not exists public.cliente_etiquetas (
  cliente_id uuid references public.clientes(id) on delete cascade,
  etiqueta_id uuid references public.etiquetas(id) on delete cascade,
  primary key (cliente_id, etiqueta_id)
);

-- 5. NOTAS / ACTIVIDADES
create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  autor_id uuid references public.profiles(id) on delete set null,
  contenido text not null,
  created_at timestamptz not null default now()
);

-- 6. HISTORIAL DE ESTADOS
create table if not exists public.historial_estados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  estado_anterior text,
  estado_nuevo text not null,
  autor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 7. ACCIONES DE VENDEDORES (flujo de aprobación)
create table if not exists public.acciones_clientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  vendedor_id uuid references public.profiles(id) on delete cascade not null,
  tipo text not null check (tipo in (
    'transferir','rechazar','liberar','escalar','compartir','solicitar_ayuda','conflicto'
  )),
  justificacion text,
  destino_id uuid references public.profiles(id) on delete set null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobada','rechazada','informativa')),
  motivo_rechazo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. NOTIFICACIONES
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete cascade not null,
  tipo text not null,
  mensaje text not null,
  leida boolean not null default false,
  referencia_id uuid,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'admin'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: actualizar updated_at en clientes
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_clientes_updated_at on public.clientes;
create trigger set_clientes_updated_at
  before update on public.clientes
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS (Row Level Security) - cada usuario ve solo sus datos
-- ============================================================
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.etiquetas enable row level security;
alter table public.cliente_etiquetas enable row level security;
alter table public.notas enable row level security;
alter table public.historial_estados enable row level security;
alter table public.acciones_clientes enable row level security;
alter table public.notificaciones enable row level security;

-- PROFILES
create policy "usuarios ven su propio perfil" on public.profiles
  for select using (auth.uid() = id or admin_id = auth.uid());

create policy "usuarios actualizan su propio perfil" on public.profiles
  for update using (auth.uid() = id);

create policy "admin inserta vendedores" on public.profiles
  for insert with check (auth.uid() = admin_id or rol = 'admin');

-- CLIENTES
create policy "admin ve todos sus clientes" on public.clientes
  for select using (admin_id = auth.uid() or vendedor_id = auth.uid());

create policy "admin inserta clientes" on public.clientes
  for insert with check (admin_id = auth.uid());

create policy "admin actualiza clientes" on public.clientes
  for update using (admin_id = auth.uid() or vendedor_id = auth.uid());

create policy "admin elimina clientes" on public.clientes
  for delete using (admin_id = auth.uid());

-- ETIQUETAS
create policy "admin gestiona sus etiquetas" on public.etiquetas
  for all using (admin_id = auth.uid());

-- CLIENTE_ETIQUETAS
create policy "acceso a etiquetas de clientes propios" on public.cliente_etiquetas
  for all using (
    exists (select 1 from public.clientes c where c.id = cliente_id and (c.admin_id = auth.uid() or c.vendedor_id = auth.uid()))
  );

-- NOTAS
create policy "acceso a notas de clientes propios" on public.notas
  for all using (
    exists (select 1 from public.clientes c where c.id = cliente_id and (c.admin_id = auth.uid() or c.vendedor_id = auth.uid()))
  );

-- HISTORIAL
create policy "acceso a historial de clientes propios" on public.historial_estados
  for all using (
    exists (select 1 from public.clientes c where c.id = cliente_id and (c.admin_id = auth.uid() or c.vendedor_id = auth.uid()))
  );

-- ACCIONES
create policy "vendedor gestiona sus acciones" on public.acciones_clientes
  for all using (vendedor_id = auth.uid() or
    exists (select 1 from public.clientes c where c.id = cliente_id and c.admin_id = auth.uid())
  );

-- NOTIFICACIONES
create policy "usuarios ven sus notificaciones" on public.notificaciones
  for all using (usuario_id = auth.uid());
