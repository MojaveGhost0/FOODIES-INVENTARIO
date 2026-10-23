-- ════════════════════════════════════════════════════════
--  Sistema de Inventario Gastronómico — Supabase Database Setup
--  Parrilla, Comida Rápida, Comida Árabe, Bebidas y Cocina
--  Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- ════════════════════════════════════════════════════════

-- ── Habilitar extensión UUID ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabla: productos (Insumos y Platos de Cocina) ─────────
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

-- ── Tabla: movimientos (Historial de Despachos y Entradas) ─
CREATE TABLE IF NOT EXISTS movimientos (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id       UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre   TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('entrada','salida','nuevo','eliminado','edicion')),
  cantidad          INTEGER,
  cantidad_anterior INTEGER,
  cantidad_nueva    INTEGER,
  detalle           TEXT,
  usuario_email     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices para búsquedas rápidas ──────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_nombre    ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria);
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

DROP TRIGGER IF EXISTS productos_updated_at ON productos;
CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (RLS) ─────────────────────────────
ALTER TABLE productos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════
-- DATOS DE EJEMPLO PARA RESTAURANTE (Opcional - Quita los comentarios para insertar)
-- ════════════════════════════════════════════════════════
-- INSERT INTO productos (nombre, cantidad, unidad, categoria, stock_minimo, notas) VALUES
--   -- ── PARRILLA Y CARNES ──
--   ('Punta Trasera / Picanha Premium', 25,  'kg',        'Parrilla y Carnes',    8,  'Proveedor Carnes del Centro. Mantener a -2°C'),
--   ('Pechuga de Pollo para Asar',     30,  'kg',        'Parrilla y Carnes',    10, 'Limpia y fileteada'),
--   ('Costillas de Cerdo BBQ',         20,  'kg',        'Parrilla y Carnes',    5,  'Corte especial para ahumar'),
--   ('Chorizo Parrillero Ahumado',     40,  'unidades',  'Parrilla y Carnes',    15, 'Paquetes de 5 unidades'),
--   ('Carbón Vegetal de Quebracho',    15,  'bolsas',    'Parrilla y Carnes',    5,  'Bolsas de 10kg'),
--
--   -- ── COMIDA ÁRABE ──
--   ('Carne para Shawarma Marinada',   35,  'kg',        'Comida Árabe',        10, 'Marinado árabe especial con 7 especias'),
--   ('Pan Árabe / Pita Tradicional',   60,  'paquetes',  'Comida Árabe',        20, 'Paquetes de 10 unidades. Panadería Damasco'),
--   ('Masa para Falafel Condimentada', 15,  'kg',        'Comida Árabe',        5,  'Base de garbanzos frescos con hierbas'),
--   ('Kibbe Crudo Especial',           80,  'unidades',  'Comida Árabe',        25, 'Listos para freír o asar'),
--   ('Crema de Ajonjolí (Tahini)',     12,  'litros',    'Comida Árabe',        3,  'Para hummus y crema de berenjena'),
--
--   -- ── COMIDA RÁPIDA ──
--   ('Carne Angus para Burger 200g',   70,  'porciones', 'Comida Rápida',       20, '100% res premium'),
--   ('Pan de Hamburguesa Brioche',     80,  'unidades',  'Comida Rápida',       30, 'Con ajonjolí tostado'),
--   ('Papas Fritas Corte Recto 9mm',   18,  'bolsas',    'Comida Rápida',       6,  'Bolsas de 2.5kg pre-cocidas'),
--   ('Queso Cheddar Americano Rebanado', 10, 'paquetes', 'Comida Rápida',       3,  'Paquete de 72 rebanadas'),
--   ('Tocineta Ahumada en Tiras',      15,  'kg',        'Comida Rápida',       4,  'Empacada al vacío'),
--
--   -- ── BEBIDAS Y REFRESCOS ──
--   ('Coca-Cola Regular 2 Litros',     48,  'botellas',  'Bebidas y Refrescos', 12, 'Caja de 6 unidades'),
--   ('Coca-Cola Regular Lata 355ml',   120, 'latas',     'Bebidas y Refrescos', 24, 'Fardo de 24 latas'),
--   ('Refresco Chinotto / Sprite 2L',  36,  'botellas',  'Bebidas y Refrescos', 8,  'Cajas de 6 unidades'),
--   ('Agua Mineral Sin Gas 500ml',     96,  'botellas',  'Bebidas y Refrescos', 20, 'Fardos de 24 botellas'),
--   ('Cerveza Polar Pilsen Botella',   72,  'botellas',  'Bebidas y Refrescos', 24, 'Cajas de 36'),
--
--   -- ── JUGOS Y FRUTAS ──
--   ('Pulpa de Parchita / Maracuyá',   14,  'litros',    'Jugos y Frutas',      4,  'Pulpa pura congelada'),
--   ('Pulpa de Fresa Natural',         16,  'litros',    'Jugos y Frutas',      4,  'Pulpa pura congelada'),
--   ('Melón Cantaloupe Fresco',        12,  'unidades',  'Jugos y Frutas',      3,  'Para jugo del día'),
--   ('Hielo en Cubos Purificado',      25,  'bolsas',    'Jugos y Frutas',      8,  'Bolsas de 5kg'),
--
--   -- ── SALSAS Y CONDIMENTOS ──
--   ('Salsa de Ajo Casera de la Casa', 18,  'litros',    'Salsas y Condimentos', 5,  'Receta secreta del restaurante'),
--   ('Salsa BBQ Ahumada Artesanal',    12,  'litros',    'Salsas y Condimentos', 3,  'Para costillas y burgers'),
--   ('Aceite Vegetal para Freidora',   40,  'litros',    'Salsas y Condimentos', 15, 'Bidones de 20 litros'),
--   ('Zumaque y 7 Especias Árabes',    4,   'kg',        'Salsas y Condimentos', 1,  'Mezcla importada de condimentos');
