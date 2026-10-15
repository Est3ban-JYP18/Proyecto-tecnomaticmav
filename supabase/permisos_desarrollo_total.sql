-- =============================================================================
-- TECNOMATIC MAV - PERMISOS TOTALES PARA DESARROLLO / DEMOSTRACIÓN
-- =============================================================================
-- Ejecuta este archivo completo en Supabase > SQL Editor.
-- Permite SELECT, INSERT, UPDATE y DELETE desde la app para las claves anon y
-- authenticated. Corrige el error: "new row violates row-level security".
--
-- ATENCIÓN: úsalo solo para terminar pruebas o una demostración. Cualquier
-- visitante de tu sitio podría modificar datos. Antes de publicar se debe
-- reemplazar por políticas por rol y por usuario.
-- =============================================================================

DO $$
DECLARE
  tabla TEXT;
  tablas TEXT[] := ARRAY[
    'Roles',
    'Usuarios',
    'Categoria_productos',
    'Productos',
    'Stock',
    'Movimientos_Inventario',
    'Producto_Atributos',
    'Producto_Imagenes',
    'Producto_Variantes',
    'Productos_Papelera',
    'Auditoria_Productos',
    'Facturas',
    'Detalle_Facturas',
    'Entregas',
    'Devoluciones',
    'Resenas_Productos',
    'Alertas_Reposicion',
    'Cupones',
    'Cotizaciones'
  ];
BEGIN
  FOREACH tabla IN ARRAY tablas LOOP
    -- Activa RLS, pero concede una política total para que no bloquee la app.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated', tabla);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'dev_full_access', tabla);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      'dev_full_access',
      tabla
    );
  END LOOP;
END $$;

-- Permite que PostgreSQL genere los IDs BIGINT de las tablas INSERTadas desde la app.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Permite leer las vistas que usa el catálogo e inventario.
GRANT SELECT ON TABLE public."vista_productos", public."vista_admin_productos", public."vista_stock" TO anon, authenticated;

-- Actualiza la caché de Supabase/PostgREST inmediatamente.
NOTIFY pgrst, 'reload schema';
