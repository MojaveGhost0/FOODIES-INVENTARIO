-- ════════════════════════════════════════════════════════
--  MMGlass C.A — Supabase Security & Roles Setup
--  Script de Endurecimiento de Seguridad (Hardening)
--  Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- ════════════════════════════════════════════════════════

-- 1. Crear tabla de perfiles (roles) si no existe
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS en perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. Función segura para verificar si el usuario actual es administrador (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Trigger de protección: Evitar revocar el rol al último administrador del sistema
CREATE OR REPLACE FUNCTION public.prevent_removing_last_admin()
RETURNS trigger AS $$
BEGIN
  IF OLD.rol = 'admin' AND NEW.rol <> 'admin' THEN
    IF (SELECT count(*) FROM public.perfiles WHERE rol = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Operación denegada: No se puede revocar el rol al único administrador del sistema.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_last_admin ON public.perfiles;
CREATE TRIGGER trigger_prevent_last_admin
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_removing_last_admin();

-- 5. Políticas de seguridad estrictas para la tabla perfiles
DROP POLICY IF EXISTS "Permitir a los usuarios leer su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Admins pueden actualizar perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver su perfil o admins todos" ON public.perfiles;
DROP POLICY IF EXISTS "Solo admins pueden actualizar perfiles" ON public.perfiles;

-- Los usuarios normales solo ven su propio perfil; los administradores ven todos
CREATE POLICY "Usuarios autenticados pueden ver su perfil o admins todos" 
ON public.perfiles FOR SELECT 
TO authenticated 
USING ( auth.uid() = id OR public.is_admin() );

-- Solo los administradores pueden cambiar roles de usuario
CREATE POLICY "Solo admins pueden actualizar perfiles" 
ON public.perfiles FOR UPDATE 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 6. Trigger automático para asignar perfil al registrar un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, rol)
  VALUES (new.id, new.email, 'usuario')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Asegurar que tu cuenta principal sea administrador
INSERT INTO public.perfiles (id, email, rol)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'juansecond22@gmail.com'
ON CONFLICT (id) DO UPDATE SET rol = 'admin';

-- 8. Auditoría y RLS para la tabla de Movimientos
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
-- Añadir columna de auditoría para rastrear el correo del autor del movimiento
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS usuario_email TEXT;

DROP POLICY IF EXISTS "auth_all_movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Usuarios pueden leer movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Admins pueden insertar movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Admins pueden actualizar movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Admins pueden eliminar movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Solo autenticados pueden leer movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Solo admins pueden insertar movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Solo admins pueden actualizar movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "Solo admins pueden eliminar movimientos" ON public.movimientos;

CREATE POLICY "Solo autenticados pueden leer movimientos" 
ON public.movimientos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Solo admins pueden insertar movimientos" 
ON public.movimientos FOR INSERT 
TO authenticated 
WITH CHECK ( public.is_admin() );

CREATE POLICY "Solo admins pueden actualizar movimientos" 
ON public.movimientos FOR UPDATE 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

CREATE POLICY "Solo admins pueden eliminar movimientos" 
ON public.movimientos FOR DELETE 
TO authenticated 
USING ( public.is_admin() );

-- 9. Políticas de seguridad estrictas para Productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_productos" ON public.productos;
DROP POLICY IF EXISTS "Usuarios pueden leer productos" ON public.productos;
DROP POLICY IF EXISTS "Admins pueden insertar productos" ON public.productos;
DROP POLICY IF EXISTS "Admins pueden actualizar productos" ON public.productos;
DROP POLICY IF EXISTS "Admins pueden eliminar productos" ON public.productos;
DROP POLICY IF EXISTS "Solo autenticados pueden leer productos" ON public.productos;
DROP POLICY IF EXISTS "Solo admins pueden insertar productos" ON public.productos;
DROP POLICY IF EXISTS "Solo admins pueden actualizar productos" ON public.productos;
DROP POLICY IF EXISTS "Solo admins pueden eliminar productos" ON public.productos;

CREATE POLICY "Solo autenticados pueden leer productos" 
ON public.productos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Solo admins pueden insertar productos" 
ON public.productos FOR INSERT 
TO authenticated 
WITH CHECK ( public.is_admin() );

CREATE POLICY "Solo admins pueden actualizar productos" 
ON public.productos FOR UPDATE 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

CREATE POLICY "Solo admins pueden eliminar productos" 
ON public.productos FOR DELETE 
TO authenticated 
USING ( public.is_admin() );
