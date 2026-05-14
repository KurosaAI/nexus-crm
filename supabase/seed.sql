-- ============================================================
-- NEXUS CRM - Datos de ejemplo
-- IMPORTANTE: Ejecutar DESPUÉS del schema.sql y DESPUÉS de
-- registrarte en la app. Reemplaza <TU_ADMIN_ID> con tu UUID
-- (lo encuentras en Supabase → Authentication → Users)
-- ============================================================

-- Clientes de ejemplo (sin vendedor asignado, visibles para el admin)
insert into public.clientes (nombre, email, telefono, empresa, estado, admin_id) values
  ('Ana García',       'ana.garcia@empresa.com',    '+1 809 555 0101', 'García & Asociados',  'cliente',    '<TU_ADMIN_ID>'),
  ('Carlos Méndez',    'carlos@mendezgroup.com',    '+1 809 555 0102', 'Méndez Group',        'propuesta',  '<TU_ADMIN_ID>'),
  ('Sofía Reyes',      'sofia.reyes@gmail.com',     '+1 829 555 0103', null,                  'contactado', '<TU_ADMIN_ID>'),
  ('Luis Fernández',   'luis@constructora.com',     '+1 849 555 0104', 'Constructora Norte',  'prospecto',  '<TU_ADMIN_ID>'),
  ('María Torres',     'maria.torres@outlook.com',  '+1 809 555 0105', 'Distribuidora Torres','cliente',    '<TU_ADMIN_ID>'),
  ('Andrés López',     'andres.lopez@tech.io',      '+1 829 555 0106', 'TechIO Solutions',    'prospecto',  '<TU_ADMIN_ID>'),
  ('Valentina Cruz',   'vcruz@valtech.com',         '+1 849 555 0107', 'ValTech Corp',        'propuesta',  '<TU_ADMIN_ID>'),
  ('Roberto Jiménez',  'rjimenez@rjconsult.com',    '+1 809 555 0108', 'RJ Consulting',       'contactado', '<TU_ADMIN_ID>'),
  ('Isabela Morales',  'imorales@bella.store',      '+1 829 555 0109', 'Bella Store',         'cliente',    '<TU_ADMIN_ID>'),
  ('Diego Castillo',   'diego@castilloind.com',     '+1 849 555 0110', 'Castillo Industrias', 'inactivo',   '<TU_ADMIN_ID>');
