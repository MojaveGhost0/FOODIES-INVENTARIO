import { supabase } from './supabase'

// ─── SEGURIDAD: CONSTANTES Y LISTAS BLANCAS ──────────────────────────────────
export const ALLOWED_CATEGORIAS = [
  'Carnes y Embutidos',
  'Pollo y Pescados',
  'Panes y Masas',
  'Granos y Cereales',
  'Lácteos y Quesos',
  'Aceites y Grasas',
  'Bebidas y Refrescos',
  'Jugos y Frutas',
  'Vegetales y Frescos',
  'Salsas y Condimentos',
  'Desechables y Empaques',
  'Otro'
]

export const ALLOWED_UNIDADES = [
  'kg',
  'gramos',
  'litros',
  'porciones',
  'unidades',
  'botellas',
  'latas',
  'paquetes',
  'bolsas',
  'cajas'
]

const ALLOWED_TIPOS_MOVIMIENTO = [
  'entrada',
  'salida',
  'nuevo',
  'eliminado',
  'edicion'
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ─── SEGURIDAD: SANITIZACIÓN Y VALIDACIÓN ─────────────────────────────────────

function sanitizeString(str, maxLength = 255) {
  if (str === null || str === undefined) return null
  // Convertir a string, remover caracteres de control nulos y recortar espacios
  const cleanStr = String(str).replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '').trim()
  if (!cleanStr) return null
  return cleanStr.length > maxLength ? cleanStr.substring(0, maxLength) : cleanStr
}

function ensureInt(val, fallback = 0, max = 2147483647) {
  const parsed = parseInt(val, 10)
  if (isNaN(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}

function sanitizeUrl(url) {
  if (!url) return null
  const clean = String(url).trim()
  try {
    const parsed = new URL(clean)
    // Solo permitir https (o http en localhost para desarrollo)
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'))) {
      return clean.length > 1000 ? clean.substring(0, 1000) : clean
    }
  } catch {
    return null
  }
  return null
}

function validateUuid(id) {
  if (!id) return null
  const str = String(id).trim()
  return UUID_REGEX.test(str) ? str : null
}

function validateCategory(cat) {
  const clean = sanitizeString(cat, 50)
  return ALLOWED_CATEGORIAS.includes(clean) ? clean : 'Otro'
}

function validateUnit(unit) {
  const clean = sanitizeString(unit, 50)
  return ALLOWED_UNIDADES.includes(clean) ? clean : 'unidades'
}

// ─── AUDITORÍA Y REGISTRO DE MOVIMIENTOS ──────────────────────────────────────

async function logMovimiento(movimiento) {
  try {
    // Obtener el usuario autenticado actual para trazabilidad
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email || 'desconocido'

    const safeMovimiento = {
      producto_id: validateUuid(movimiento.producto_id),
      producto_nombre: sanitizeString(movimiento.producto_nombre, 100) || 'Sin nombre',
      tipo: ALLOWED_TIPOS_MOVIMIENTO.includes(movimiento.tipo) ? movimiento.tipo : 'edicion',
      cantidad: movimiento.cantidad != null ? ensureInt(movimiento.cantidad, 0) : null,
      cantidad_anterior: movimiento.cantidad_anterior != null ? ensureInt(movimiento.cantidad_anterior, 0) : null,
      cantidad_nueva: movimiento.cantidad_nueva != null ? ensureInt(movimiento.cantidad_nueva, 0) : null,
      detalle: sanitizeString(movimiento.detalle, 500),
      usuario_email: userEmail
    }

    // Intentar insertar con usuario_email; si la columna aún no fue migrada en Supabase, reintentar sin ella
    const { error } = await supabase.from('movimientos').insert([safeMovimiento])
    if (error) {
      if (error.message?.includes('usuario_email') || error.code === 'PGRST204') {
        const { usuario_email, ...fallbackMovimiento } = safeMovimiento
        const { error: fallbackError } = await supabase.from('movimientos').insert([fallbackMovimiento])
        if (fallbackError) console.error('Error al registrar movimiento (fallback):', fallbackError)
      } else {
        console.error('Error al registrar movimiento:', error)
      }
    }
  } catch (err) {
    console.error('Excepción al registrar movimiento de auditoría:', err)
  }
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addProducto({ nombre, cantidad, unidad, categoria, stock_minimo, notas, imagen_url }) {
  const safeNombre = sanitizeString(nombre, 100)
  if (!safeNombre) throw new Error('El nombre del producto es obligatorio.')

  const cleanProducto = {
    nombre: safeNombre,
    cantidad: ensureInt(cantidad, 0),
    unidad: validateUnit(unidad),
    categoria: validateCategory(categoria),
    stock_minimo: ensureInt(stock_minimo, 5),
    notas: sanitizeString(notas, 500),
    imagen_url: sanitizeUrl(imagen_url)
  }

  const { data, error } = await supabase
    .from('productos')
    .insert([cleanProducto])
    .select()
    .single()
  if (error) throw error

  await logMovimiento({
    producto_id: data.id,
    producto_nombre: data.nombre,
    tipo: 'nuevo',
    cantidad: data.cantidad,
    cantidad_anterior: 0,
    cantidad_nueva: data.cantidad,
    detalle: 'Registro inicial de producto',
  })

  return data
}

export async function updateCantidad({ id, nombre, cantidadAnterior, cantidadNueva, tipo, detalle }) {
  const safeId = validateUuid(id)
  if (!safeId) throw new Error('Identificador de producto inválido.')

  const safeCantidadNueva = ensureInt(cantidadNueva, 0)
  const safeCantidadAnterior = ensureInt(cantidadAnterior, 0)
  const safeDetalle = sanitizeString(detalle, 500)
  const safeTipo = ALLOWED_TIPOS_MOVIMIENTO.includes(tipo) ? tipo : 'edicion'

  const { data, error } = await supabase
    .from('productos')
    .update({ cantidad: safeCantidadNueva })
    .eq('id', safeId)
    .select()
    .single()

  if (error) throw error

  await logMovimiento({
    producto_id: safeId,
    producto_nombre: sanitizeString(nombre, 100) || 'Producto',
    tipo: safeTipo,
    cantidad: Math.abs(safeCantidadNueva - safeCantidadAnterior),
    cantidad_anterior: safeCantidadAnterior,
    cantidad_nueva: safeCantidadNueva,
    detalle: safeDetalle,
  })

  return data
}

export async function editProducto(id, newData, oldNombre) {
  const safeId = validateUuid(id)
  if (!safeId) throw new Error('Identificador de producto inválido.')

  const safeNombre = sanitizeString(newData.nombre, 100)
  if (!safeNombre) throw new Error('El nombre no puede estar vacío.')

  const cleanData = {
    nombre: safeNombre,
    cantidad: ensureInt(newData.cantidad, 0),
    unidad: validateUnit(newData.unidad),
    categoria: validateCategory(newData.categoria),
    stock_minimo: ensureInt(newData.stock_minimo, 5),
    notas: sanitizeString(newData.notas, 500),
    imagen_url: sanitizeUrl(newData.imagen_url)
  }

  const { data, error } = await supabase
    .from('productos')
    .update(cleanData)
    .eq('id', safeId)
    .select()
    .single()

  if (error) throw error

  await logMovimiento({
    producto_id: safeId,
    producto_nombre: cleanData.nombre || oldNombre,
    tipo: 'edicion',
    detalle: 'Datos del producto modificados manualmente',
  })

  return data
}

export async function deleteProducto(id, nombre, cantidad) {
  const safeId = validateUuid(id)
  if (!safeId) throw new Error('Identificador de producto inválido.')

  const safeCantidad = ensureInt(cantidad, 0)

  await logMovimiento({
    producto_id: null,
    producto_nombre: sanitizeString(nombre, 100) || 'Producto eliminado',
    tipo: 'eliminado',
    cantidad: safeCantidad,
    cantidad_anterior: safeCantidad,
    cantidad_nueva: 0,
    detalle: 'Producto eliminado del inventario',
  })

  const { error } = await supabase.from('productos').delete().eq('id', safeId)
  if (error) throw error
}

export async function restockProducto({ id, nombre, cantidadActual, cantidadAgregar, notas }) {
  const safeId = validateUuid(id)
  if (!safeId) throw new Error('Identificador de producto inválido.')

  const safeAgregar = ensureInt(cantidadAgregar, 0)
  const safeActual = ensureInt(cantidadActual, 0)
  const nuevaCantidad = safeActual + safeAgregar

  return updateCantidad({
    id: safeId,
    nombre,
    cantidadAnterior: safeActual,
    cantidadNueva: nuevaCantidad,
    tipo: 'entrada',
    detalle: sanitizeString(notas, 500) || `Restock de ${safeAgregar} unidades`,
  })
}

// ─── MOVIMIENTOS ──────────────────────────────────────────────────────────────

export async function getMovimientos(tipo = 'all') {
  // SEGURIDAD: Límite estricto de registros para prevenir denegación de servicio por memoria
  let query = supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (tipo !== 'all' && ALLOWED_TIPOS_MOVIMIENTO.includes(tipo)) {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function clearMovimientos() {
  const { error } = await supabase
    .from('movimientos')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
}

export async function getMovimientosHoy() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('movimientos')
    .select('id')
    .gte('created_at', today.toISOString())
  if (error) return 0
  return data?.length || 0
}
