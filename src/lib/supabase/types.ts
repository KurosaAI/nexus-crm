export type EstadoCliente = 'prospecto' | 'contactado' | 'propuesta' | 'cliente' | 'inactivo'
export type RolUsuario = 'admin' | 'vendedor'

export interface Profile {
  id: string
  nombre: string
  rol: RolUsuario
  codigo_acceso?: string
  admin_id?: string
  activo: boolean
  created_at: string
}

export interface Cliente {
  id: string
  nombre: string
  email?: string
  telefono?: string
  empresa?: string
  estado: EstadoCliente
  notas_rapidas?: string
  vendedor_id?: string
  admin_id: string
  created_at: string
  updated_at: string
  vendedor?: { id: string; nombre: string } | null
}

export interface Nota {
  id: string
  cliente_id: string
  autor_id: string
  contenido: string
  created_at: string
  autor?: { nombre: string } | null
}

export interface HistorialEstado {
  id: string
  cliente_id: string
  estado_anterior?: EstadoCliente
  estado_nuevo: EstadoCliente
  autor_id: string
  created_at: string
  autor?: { nombre: string } | null
}

export const ESTADO_COLORS: Record<EstadoCliente, string> = {
  prospecto:  'bg-gray-100 border-gray-200 text-black/60',
  contactado: 'bg-sky-50 border-sky-200 text-sky-700',
  propuesta:  'bg-indigo-50 border-indigo-200 text-indigo-700',
  cliente:    'bg-blue-50 border-blue-200 text-blue-700',
  inactivo:   'bg-red-50 border-red-200 text-red-500',
}

export const ESTADO_KEYS: EstadoCliente[] = ['prospecto', 'contactado', 'propuesta', 'cliente', 'inactivo']
