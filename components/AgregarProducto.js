'use client'
import { useState } from 'react'
import { addProducto, restockProducto, ALLOWED_CATEGORIAS as CATEGORIAS, ALLOWED_UNIDADES as UNIDADES } from '@/lib/db'
import { useToast } from './Toast'

export default function AgregarProducto({ productos = [], setProductos, setActiveTab }) {
  const toast = useToast()
  const [tipo, setTipo] = useState('nuevo')

  // ── Form: Nuevo Producto / Insumo Gastronómico ──
  const [nuevoForm, setNuevoForm] = useState({
    nombre: '', cantidad: '', unidad: 'kg',
    categoria: 'Carnes y Embutidos', stock_minimo: '5', notas: '', imagen_url: ''
  })
  const [loadingNuevo, setLoadingNuevo] = useState(false)

  // ── Form: Restock ──
  const [restockForm, setRestockForm] = useState({
    producto_id: '', cantidad: '', notas: '',
  })
  const [loadingRestock, setLoadingRestock] = useState(false)

  const selectedProducto = (productos || []).find(p => p.id === restockForm.producto_id)

  function handleNuevoChange(e) {
    setNuevoForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleRestockChange(e) {
    setRestockForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleNuevoSubmit(e) {
    e.preventDefault()
    if (!nuevoForm.nombre.trim()) return toast('El nombre es obligatorio', 'error')
    if (!nuevoForm.cantidad || Number(nuevoForm.cantidad) < 0) return toast('Cantidad inválida', 'error')

    setLoadingNuevo(true)
    try {
      const nuevo = await addProducto({
        nombre:      nuevoForm.nombre.trim(),
        cantidad:    Number(nuevoForm.cantidad),
        unidad:      nuevoForm.unidad,
        categoria:   nuevoForm.categoria,
        stock_minimo: Number(nuevoForm.stock_minimo) || 5,
        notas:       nuevoForm.notas.trim() || null,
        imagen_url:  nuevoForm.imagen_url || null,
      })
      setProductos(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      toast(`"${nuevo.nombre}" agregado al inventario`, 'success')
      setNuevoForm({ nombre: '', cantidad: '', unidad: 'kg', categoria: 'Carnes y Embutidos', stock_minimo: '5', notas: '', imagen_url: '' })
      setTimeout(() => setActiveTab('dashboard'), 800)
    } catch (err) {
      toast('Error al agregar producto', 'error')
    } finally {
      setLoadingNuevo(false)
    }
  }

  async function handleRestockSubmit(e) {
    e.preventDefault()
    if (!restockForm.producto_id) return toast('Selecciona un producto', 'error')
    if (!restockForm.cantidad || Number(restockForm.cantidad) <= 0) return toast('Cantidad debe ser mayor a 0', 'error')

    setLoadingRestock(true)
    try {
      const updated = await restockProducto({
        id:             selectedProducto.id,
        nombre:         selectedProducto.nombre,
        cantidadActual: selectedProducto.cantidad,
        cantidadAgregar: Number(restockForm.cantidad),
        notas:          restockForm.notas.trim() || null,
      })
      setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
      toast(`Restock de "${selectedProducto.nombre}" aplicado`, 'success')
      setRestockForm({ producto_id: '', cantidad: '', notas: '' })
      setTimeout(() => setActiveTab('dashboard'), 800)
    } catch (err) {
      toast('Error al hacer restock', 'error')
    } finally {
      setLoadingRestock(false)
    }
  }

  const newTotal = selectedProducto && restockForm.cantidad
    ? selectedProducto.cantidad + Number(restockForm.cantidad)
    : null

  return (
    <div className="tab-content">
      <div className="add-container">
        {/* ── Type toggle ── */}
        <div className="type-toggle-section">
          <h2 className="section-title">Registro de Producto</h2>
          <div className="type-toggle">
            <button
              className={`type-btn${tipo === 'nuevo' ? ' active' : ''}`}
              onClick={() => setTipo('nuevo')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Producto Nuevo
            </button>
            <button
              className={`type-btn${tipo === 'restock' ? ' active is-teal' : ''}`}
              onClick={() => setTipo('restock')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4"/>
              </svg>
              Restock
            </button>
          </div>
        </div>

        {/* ── Form: Nuevo Producto ── */}
        {tipo === 'nuevo' && (
          <form className="form-card" onSubmit={handleNuevoSubmit}>
            <div className="form-card-header">
              <div className="form-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div>
                <h3>Nuevo Insumo / Producto</h3>
                <p>Registra carnes, panes, granos, l&aacute;cteos, vegetales, bebidas y m&aacute;s insumos de cocina</p>
              </div>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Insumo / Producto *</label>
                <input
                  id="nombre" name="nombre" type="text"
                  placeholder="Ej: Carne Angus 200g, Pan Árabe, Pulpa de Mora, Coca-Cola 2L…"
                  value={nuevoForm.nombre}
                  onChange={handleNuevoChange}
                  maxLength={100}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cantidad">Stock Inicial en Cocina *</label>
                  <input
                    id="cantidad" name="cantidad" type="number"
                    placeholder="0" min="0"
                    value={nuevoForm.cantidad}
                    onChange={handleNuevoChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="unidad">Unidad de Medida</label>
                  <select id="unidad" name="unidad" value={nuevoForm.unidad} onChange={handleNuevoChange}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="categoria">Categoría del Restaurante</label>
                  <select id="categoria" name="categoria" value={nuevoForm.categoria} onChange={handleNuevoChange}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="stock_minimo">Stock Crítico (Mínimo)</label>
                  <input
                    id="stock_minimo" name="stock_minimo" type="number"
                    placeholder="5" min="0"
                    value={nuevoForm.stock_minimo}
                    onChange={handleNuevoChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notas">Notas / Especificaciones (opcional)</label>
                <textarea
                  id="notas" name="notas"
                  placeholder="Proveedor, temperatura de almacenamiento (-18°C / 4°C), receta o lote…"
                  value={nuevoForm.notas}
                  onChange={handleNuevoChange}
                  rows={3}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loadingNuevo}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                {loadingNuevo ? 'Guardando…' : 'Agregar al Inventario'}
              </button>
            </div>
          </form>
        )}

        {/* ── Form: Restock ── */}
        {tipo === 'restock' && (
          <form className="form-card" onSubmit={handleRestockSubmit}>
            <div className="form-card-header">
              <div className="form-card-icon teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4"/>
                </svg>
              </div>
              <div>
                <h3>Restock de Producto</h3>
                <p>Añadir unidades a un producto existente</p>
              </div>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label htmlFor="producto_id">Seleccionar Producto *</label>
                <select
                  id="producto_id" name="producto_id"
                  value={restockForm.producto_id}
                  onChange={handleRestockChange}
                >
                  <option value="">— Selecciona un producto —</option>
                  {(productos || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.cantidad} {p.unidad})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProducto && (
                <div className="restock-preview">
                  <div className="rp-label">Stock Actual</div>
                  <div className="rp-value">{selectedProducto.cantidad}</div>
                  <div className="rp-unit">{selectedProducto.unidad}</div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="restock-cantidad">Cantidad a Agregar *</label>
                <input
                  id="restock-cantidad" name="cantidad" type="number"
                  placeholder="0" min="1"
                  value={restockForm.cantidad}
                  onChange={handleRestockChange}
                />
              </div>

              {newTotal != null && newTotal > selectedProducto.cantidad && (
                <div className="restock-result">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                  Nuevo total: <strong>{newTotal} {selectedProducto?.unidad}</strong>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="restock-notas">Notas de Recepción (opcional)</label>
                <input
                  id="restock-notas" name="notas" type="text"
                  placeholder="Proveedor, factura de compra, fecha de vencimiento…"
                  value={restockForm.notas}
                  onChange={handleRestockChange}
                />
              </div>

              <button type="submit" className="btn-primary is-teal" disabled={loadingRestock}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4"/>
                </svg>
                {loadingRestock ? 'Guardando…' : 'Confirmar Restock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
