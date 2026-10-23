'use client'

export default function DeleteModal({ producto, onClose, onConfirm }) {
  const isOpen = !!producto

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={onClose}>
      <div className="modal-box sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head is-danger">
          <h3>Dar de Baja Insumo</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="delete-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className="delete-msg">
            ¿Eliminar <strong>"{producto?.nombre}"</strong> del inventario de cocina?
          </p>
          <p className="delete-sub">
            Stock actual: {producto?.cantidad} {producto?.unidad} · Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="modal-foot">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-danger" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}
