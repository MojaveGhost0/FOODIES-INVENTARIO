'use client'
import { useRef, useCallback } from 'react'

function getStockLevel(cantidad, minimo = 5) {
  if (cantidad <= 0) return 'out'
  if (cantidad <= minimo) return 'low'
  if (cantidad <= minimo * 4) return 'normal'
  return 'high'
}

const STOCK_LABEL = { out: 'Sin Stock', low: 'Stock Bajo', normal: 'Normal', high: 'Alto' }

const CAT_CLASS = {
  'Cristal':          '',
  'Aluminio':         'Aluminio',
  'Acero Inoxidable': 'Acero',
  'Herrajes':         'Herrajes',
  'Selladores':       'Selladores',
  'Herramientas':     'Herramientas',
}

export default function ProductCard({ producto, onIncrement, onDecrement, onEdit, onDelete, userRole }) {
  const { nombre, cantidad, unidad, categoria, stock_minimo, imagen_url } = producto
  const stockLevel = getStockLevel(cantidad, stock_minimo)
  const qtyRef = useRef(null)

  const animateBump = useCallback(() => {
    if (!qtyRef.current) return
    qtyRef.current.classList.remove('bump')
    void qtyRef.current.offsetWidth // reflow
    qtyRef.current.classList.add('bump')
  }, [])

  const handleIncrement = () => {
    animateBump()
    onIncrement()
  }

  const handleDecrement = () => {
    if (cantidad <= 0) return
    animateBump()
    onDecrement()
  }

  const catClass = CAT_CLASS[categoria] || ''

  return (
    <div className={`product-card stock-${stockLevel}`}>
      {/* ── Top: category + stock status ── */}
      <div className="card-top">
        <span className={`cat-badge ${catClass}`}>
          {categoria || 'Otro'}
        </span>
        <span className={`stock-pill ${stockLevel === 'high' || stockLevel === 'normal' ? 'ok' : stockLevel}`}>
          <span className="stock-pill-dot" />
          {STOCK_LABEL[stockLevel]}
        </span>
      </div>

      {/* ── Product name and image ── */}
      {imagen_url && (
        <div style={{ margin: '0.5rem 0', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5' }}>
          <img 
            src={imagen_url} 
            alt={nombre} 
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
      )}
      <h3 className="card-name">{nombre}</h3>

      {/* ── Quantity controls ── */}
      <div className="qty-section">
        {userRole === 'admin' && (
          <button
            className="qty-btn minus"
            onClick={handleDecrement}
            disabled={cantidad <= 0}
            title="Restar 1"
            aria-label="Restar cantidad"
          >
            −
          </button>
        )}

        <div className="qty-display">
          <span className="qty-number" ref={qtyRef}>{cantidad}</span>
          <span className="qty-unit">{unidad || 'unidades'}</span>
        </div>

        {userRole === 'admin' && (
          <button
            className="qty-btn plus"
            onClick={handleIncrement}
            title="Sumar 1"
            aria-label="Agregar cantidad"
          >
            +
          </button>
        )}
      </div>

      {/* ── Actions ── */}
      {userRole === 'admin' && (
        <div className="card-actions">
          <button className="btn-edit" onClick={onEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          <button className="btn-delete" onClick={onDelete} title="Eliminar producto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
