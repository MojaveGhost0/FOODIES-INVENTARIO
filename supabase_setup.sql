-- ════════════════════════════════════════════════════════
--  MMGlass C.A — Supabase Database Setup
--  Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- ════════════════════════════════════════════════════════

-- ── Habilitar extensión UUID ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabla: productos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       TEXT NOT NULL,
  cantidad     INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  unidad       TEXT NOT NULL DEFAULT 'unidades',
  categoria    TEXT NOT NULL DEFAULT 'Otro',
  stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  notas        TEXT,
  imagen_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla: movimientos ────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id       UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre   TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('entrada','salida','nuevo','eliminado','edicion')),
  cantidad          INTEGER,
  cantidad_anterior INTEGER,
  cantidad_nueva    INTEGER,
  detalle           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices para búsquedas rápidas ──────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_nombre    ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo    ON movimientos (tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha   ON movimientos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_prod    ON movimientos (producto_id);

-- ── Función: actualizar updated_at automáticamente ───────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (RLS) ─────────────────────────────
-- Habilitar RLS en ambas tablas
ALTER TABLE productos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso restringido a usuarios autenticados
CREATE POLICY "auth_all_productos"   ON productos   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_movimientos" ON movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════
-- DATOS DE EJEMPLO (opcional — puedes borrar esto)
-- ════════════════════════════════════════════════════════
-- INSERT INTO productos (nombre, cantidad, unidad, categoria, stock_minimo) VALUES
--   ('Cristal Claro 6mm',           50,  'láminas',  'Cristal',          10),
--   ('Cristal Templado 8mm',         30,  'láminas',  'Cristal',          8),
--   ('Perfil Aluminio T-35',         200, 'barras',   'Aluminio',         50),
--   ('Perfil Aluminio U-40',         150, 'barras',   'Aluminio',         40),
--   ('Bisagra Acero Inox 3"',        100, 'unidades', 'Herrajes',         20),
--   ('Silicona Structural Clear',    24,  'unidades', 'Selladores',       6),
--   ('Sellador Neutro Blanco',       36,  'unidades', 'Selladores',       8);
