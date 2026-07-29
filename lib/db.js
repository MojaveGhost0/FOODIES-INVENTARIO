import { supabase } from './supabase'

// ─── SEGURIDAD: SANITIZACIÓN ────────────────────────────────────────────────
function sanitizeString(str, maxLength = 255) {
  if (!str) return null
  const cleanStr = String(str).trim()
  return cleanStr.length > maxLength ? cleanStr.substring(0, maxLength) : cleanStr
}

function ensureInt(val, fallback = 0) {
  const parsed = parseInt(val, 10)
  return isNaN(parsed) || parsed < 0 ? fallback : parsed
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function logMovimiento(movimiento) {
  const { error } = await supabase.from('movimientos').insert([movimiento])
  if (error) console.error('Error al registrar movimiento:', error)
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
  const cleanProducto = {
    nombre: sanitizeString(nombre, 100) || 'Producto sin nombre',
    cantidad: ensureInt(cantidad, 0),
    unidad: sanitizeString(unidad, 50) || 'unidades',
    categoria: sanitizeString(categoria, 50) || 'Otro',
    stock_minimo: ensureInt(stock_minimo, 5),
    notas: sanitizeString(notas, 500),
    imagen_url: sanitizeString(imagen_url, 1000)
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
  const safeCantidadNueva = ensureInt(cantidadNueva, 0)
  const safeCantidadAnterior = ensureInt(cantidadAnterior, 0)
  const safeDetalle = sanitizeString(detalle, 500)

  const { data, error } = await supabase
    .from('productos')
    .update({ cantidad: safeCantidadNueva })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logMovimiento({
    producto_id: id,
    producto_nombre: nombre,
    tipo,
    cantidad: Math.abs(safeCantidadNueva - safeCantidadAnterior),
    cantidad_anterior: safeCantidadAnterior,
    cantidad_nueva: safeCantidadNueva,
    detalle: safeDetalle,
  })

  return data
}

export async function editProducto(id, newData, oldNombre) {
  const cleanData = {
    nombre: sanitizeString(newData.nombre, 100),
    cantidad: ensureInt(newData.cantidad, 0),
    unidad: sanitizeString(newData.unidad, 50),
    categoria: sanitizeString(newData.categoria, 50),
    stock_minimo: ensureInt(newData.stock_minimo, 5),
    notas: sanitizeString(newData.notas, 500),
    imagen_url: sanitizeString(newData.imagen_url, 1000)
  }

  const { data, error } = await supabase
    .from('productos')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logMovimiento({
    producto_id: id,
    producto_nombre: cleanData.nombre || oldNombre,
    tipo: 'edicion',
    detalle: 'Datos del producto modificados manualmente',
  })

  return data
}

export async function deleteProducto(id, nombre, cantidad) {
  await logMovimiento({
    producto_id: null,
    producto_nombre: nombre,
    tipo: 'eliminado',
    cantidad,
    cantidad_anterior: cantidad,
    cantidad_nueva: 0,
    detalle: `Producto eliminado del inventario`,
  })

  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) throw error
}

export async function restockProducto({ id, nombre, cantidadActual, cantidadAgregar, notas }) {
  const safeAgregar = ensureInt(cantidadAgregar, 0)
  const safeActual = ensureInt(cantidadActual, 0)
  const nuevaCantidad = safeActual + safeAgregar

  return updateCantidad({
    id,
    nombre,
    cantidadAnterior: safeActual,
    cantidadNueva: nuevaCantidad,
    tipo: 'entrada',
    detalle: sanitizeString(notas, 500) || `Restock de ${safeAgregar} unidades`,
  })
}

// ─── MOVIMIENTOS ──────────────────────────────────────────────────────────────

export async function getMovimientos(tipo = 'all') {
  // SEGURIDAD: Limitamos a 100 registros para evitar colapsos
  let query = supabase
    .from('movimientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (tipo !== 'all') {
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
