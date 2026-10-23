'use client'
import { useState, useEffect } from 'react'
import { ALLOWED_CATEGORIAS as CATEGORIAS, ALLOWED_UNIDADES as UNIDADES } from '@/lib/db'

export default function EditModal({ producto, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '', cantidad: '', unidad: 'kg',
    categoria: 'Carnes y Embutidos', stock_minimo: '5', notas: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (producto) {
      setForm({
        nombre:      producto.nombre || '',
        cantidad:    producto.cantidad ?? '',
        unidad:      producto.unidad || 'kg',
        categoria:   producto.categoria || 'Otro',
        stock_minimo: producto.stock_minimo ?? '5',
        notas:       producto.notas || '',
      })
    }
  }, [producto])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    await onSave({
      nombre:       form.nombre.trim(),
      cantidad:     Number(form.cantidad),
      unidad:       form.unidad,
      categoria:    form.categoria,
      stock_minimo: Number(form.stock_minimo) || 5,
      notas:        form.notas.trim() || null,
      imagen_url:   producto?.imagen_url || null,
    })
    setSaving(false)
  }

  const isOpen = !!producto

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Editar Insumo / Producto</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="edit-nombre">Nombre del Insumo / Producto</label>
              <input
                id="edit-nombre" name="nombre" type="text"
                value={form.nombre} onChange={handleChange} maxLength={80}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-cantidad">Cantidad</label>
                <input
                  id="edit-cantidad" name="cantidad" type="number"
                  min="0" value={form.cantidad} onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-unidad">Unidad</label>
                <select id="edit-unidad" name="unidad" value={form.unidad} onChange={handleChange}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-categoria">Categoría</label>
                <select id="edit-categoria" name="categoria" value={form.categoria} onChange={handleChange}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-minimo">Stock Mínimo</label>
                <input
                  id="edit-minimo" name="stock_minimo" type="number"
                  min="0" value={form.stock_minimo} onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-notas">Notas</label>
              <textarea
                id="edit-notas" name="notas"
                rows={2} value={form.notas} onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{width:'auto'}} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
