'use client'
import { useState, useMemo, useEffect } from 'react'
import ProductCard from './ProductCard'
import EditModal from './EditModal'
import DeleteModal from './DeleteModal'
import { updateCantidad, editProducto, deleteProducto, getMovimientosHoy } from '@/lib/db'
import { useToast } from './Toast'
import { downloadCSV, printReport, todayStamp } from '@/lib/export'

const FILTERS = [
  'Todos',
  'Parrilla y Carnes',
  'Comida Árabe',
  'Comida Rápida',
  'Bebidas y Refrescos',
  'Jugos y Frutas',
  'Vegetales y Frescos',
  'Salsas y Condimentos',
  'Insumos Agotados',
  'Stock Crítico'
]

function getStockLevel(cantidad, minimo = 5) {
  if (cantidad <= 0) return 'out'
  if (cantidad <= minimo) return 'low'
  if (cantidad <= minimo * 3) return 'normal'
  return 'high'
}

export default function Dashboard({ productos, setProductos, loading, onTabChange, userRole }) {
  const toast = useToast()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('Todos')
  const [editItem, setEditItem]     = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [movHoy, setMovHoy]   = useState(0)

  useEffect(() => {
    getMovimientosHoy().then(setMovHoy).catch(() => {})
  }, [productos])

  // Stats
  const insumosAgotados = useMemo(() =>
    productos.filter(p => (p.cantidad || 0) <= 0).length,
  [productos])

  const stockBajo = useMemo(() =>
    productos.filter(p => (p.cantidad || 0) > 0 && (p.cantidad || 0) <= (p.stock_minimo ?? 5)).length,
  [productos])

  // Filtered products
  const filtered = useMemo(() => {
    let list = productos
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q) ||
        (p.notas || '').toLowerCase().includes(q)
      )
    }
    if (filter === 'Insumos Agotados') {
      list = list.filter(p => (p.cantidad || 0) <= 0)
    } else if (filter === 'Stock Crítico') {
      list = list.filter(p => (p.cantidad || 0) <= (p.stock_minimo ?? 5))
    } else if (filter !== 'Todos') {
      list = list.filter(p => p.categoria === filter)
    }
    return list
  }, [productos, search, filter])

  const exportHeaders = ['Insumo / Producto', 'Categoría', 'Stock actual', 'Unidad', 'Stock mínimo', 'Estado', 'Notas']
  const exportRows = () => filtered.map(p => {
    const nivel = getStockLevel(p.cantidad || 0, p.stock_minimo ?? 5)
    const estado = nivel === 'out' ? 'Agotado' : nivel === 'low' ? 'Por agotarse' : 'Disponible'
    return [p.nombre, p.categoria || 'Otro', p.cantidad || 0, p.unidad || '', p.stock_minimo ?? 5, estado, p.notas || '']
  })

  function handleExcel() {
    if (!filtered.length) return toast('No hay productos para exportar', 'info')
    downloadCSV(`foodies-inventario-${todayStamp()}.csv`, exportHeaders, exportRows())
    toast('Inventario descargado (Excel)', 'success')
  }

  function handlePDF() {
    if (!filtered.length) return toast('No hay productos para exportar', 'info')
    const ok = printReport('Inventario Actual', `${filter} · ${filtered.length} productos`, exportHeaders, exportRows())
    if (!ok) toast('El navegador bloqueó la ventana emergente. Permítela para generar el PDF.', 'error')
  }

  async function handleQuantityChange(producto, delta) {
    const nuevaCantidad = Math.max(0, producto.cantidad + delta)
    const tipo = delta > 0 ? 'entrada' : 'salida'
    const detalle = delta > 0
      ? `Entrada manual: +${delta} ${producto.unidad}`
      : `Salida manual: ${delta} ${producto.unidad}`

    try {
      const updated = await updateCantidad({
        id: producto.id,
        nombre: producto.nombre,
        cantidadAnterior: producto.cantidad,
        cantidadNueva: nuevaCantidad,
        tipo,
        detalle,
      })
      setProductos(prev => prev.map(p => p.id === producto.id ? updated : p))
      setMovHoy(m => m + 1)
    } catch (err) {
      toast('Error al actualizar cantidad', 'error')
    }
  }

  async function handleEdit(data) {
    try {
      const updated = await editProducto(editItem.id, data, editItem.nombre)
      setProductos(prev => prev.map(p => p.id === editItem.id ? updated : p))
      setEditItem(null)
      toast('Producto actualizado correctamente', 'success')
    } catch (err) {
      toast('Error al editar producto', 'error')
    }
  }

  async function handleDelete() {
    try {
      await deleteProducto(deleteItem.id, deleteItem.nombre, deleteItem.cantidad)
      setProductos(prev => prev.filter(p => p.id !== deleteItem.id))
      setDeleteItem(null)
      toast(`"${deleteItem.nombre}" eliminado`, 'info')
    } catch (err) {
      toast('Error al eliminar producto', 'error')
    }
  }

  return (
    <div className="tab-content">
      {/* ── Stats Row ── */}
      <div className="stats-row">
        <div 
          className="stat-card blue"
          onClick={() => setFilter('Todos')}
          style={{ cursor: 'pointer' }}
          title="Ver todos los insumos"
        >
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div>
            <span className="sc-num">{productos.length}</span>
            <span className="sc-label">Insumos y Platos</span>
          </div>
        </div>

        <div 
          className="stat-card red"
          onClick={() => setFilter(filter === 'Insumos Agotados' ? 'Todos' : 'Insumos Agotados')}
          style={{ cursor: 'pointer' }}
          title="Clic para ver insumos agotados"
        >
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <span className="sc-num" style={insumosAgotados > 0 ? { color: '#ef4444' } : {}}>
              {insumosAgotados}
            </span>
            <span className="sc-label">Insumos Agotados</span>
          </div>
        </div>

        <div 
          className="stat-card amber"
          onClick={() => setFilter(filter === 'Stock Crítico' ? 'Todos' : 'Stock Crítico')}
          style={{ cursor: 'pointer' }}
          title="Clic para ver insumos por agotarse"
        >
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <span className="sc-num">{stockBajo}</span>
            <span className="sc-label">Por Agotarse</span>
          </div>
        </div>

        <div className="stat-card green" title="Movimientos registrados en la jornada">
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div>
            <span className="sc-num">{movHoy}</span>
            <span className="sc-label">Consumo / Entradas</span>
          </div>
        </div>
      </div>

      {/* ── Header with filters ── */}
      <div className="section-header">
        <h2 className="section-title">Control de Cocina, Parrilla y Barra</h2>
        <div className="filter-row">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
          <button className="filter-btn" onClick={handleExcel} title="Exportar la vista actual a Excel">⬇ Excel</button>
          <button className="filter-btn" onClick={handlePDF} title="Exportar la vista actual a PDF">🖨 PDF</button>
        </div>
      </div>

      {/* ── Product Grid ── */}
      {loading ? (
        <div className="skeleton-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <p>
            {search || filter !== 'Todos'
              ? 'No hay insumos que coincidan con ese filtro en cocina.'
              : 'El inventario del restaurante está vacío.'}
          </p>
          {!search && filter === 'Todos' && userRole === 'admin' && (
            <button onClick={() => onTabChange('agregar')}>+ Registrar primer insumo o producto</button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              producto={p}
              onIncrement={() => handleQuantityChange(p, 1)}
              onDecrement={() => handleQuantityChange(p, -1)}
              onEdit={() => setEditItem(p)}
              onDelete={() => setDeleteItem(p)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <EditModal
        producto={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleEdit}
      />
      <DeleteModal
        producto={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
