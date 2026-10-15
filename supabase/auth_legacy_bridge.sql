-- PUENTE TEMPORAL PARA EL ESQUEMA ACTUAL
-- Mantiene las contraseñas fuera de las consultas que hace el navegador.
-- Ejecuta este archivo completo en Supabase > SQL Editor.

CREATE OR REPLACE FUNCTION public.iniciar_sesion_legacy(
  p_correo TEXT,
  p_contrasena TEXT
)
RETURNS TABLE (
  "idUsuarios" BIGINT,
  "Nombres" TEXT,
  "Apellidos" TEXT,
  "Correo" TEXT,
  "Roles_idRoles" INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u."idUsuarios",
    u."Nombres"::TEXT,
    u."Apellidos"::TEXT,
    u."Correo"::TEXT,
    u."Roles_idRoles"
  FROM public."Usuarios" AS u
  WHERE lower(u."Correo") = lower(trim(p_correo))
    AND u."Contrasena" = p_contrasena
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.registrar_usuario_legacy(
  p_nombres TEXT,
  p_apellidos TEXT,
  p_correo TEXT,
  p_contrasena TEXT
)
RETURNS TABLE (
  "idUsuarios" BIGINT,
  "Nombres" TEXT,
  "Apellidos" TEXT,
  "Correo" TEXT,
  "Roles_idRoles" INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(trim(p_contrasena)) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  RETURN QUERY
  INSERT INTO public."Usuarios" ("Nombres", "Apellidos", "Correo", "Contrasena", "Roles_idRoles")
  VALUES (trim(p_nombres), trim(p_apellidos), lower(trim(p_correo)), p_contrasena, 3)
  RETURNING
    "Usuarios"."idUsuarios",
    "Usuarios"."Nombres"::TEXT,
    "Usuarios"."Apellidos"::TEXT,
    "Usuarios"."Correo"::TEXT,
    "Usuarios"."Roles_idRoles";
END;
$$;

REVOKE ALL ON FUNCTION public.iniciar_sesion_legacy(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_usuario_legacy(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.iniciar_sesion_legacy(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_usuario_legacy(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- La migración posterior a Supabase Auth reemplazará este puente y almacenará
-- hashes gestionados por Auth, no contraseñas en la tabla pública.
