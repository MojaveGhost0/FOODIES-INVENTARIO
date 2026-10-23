'use client'
import { useState, useEffect } from 'react'
import { getMovimientos, clearMovimientos } from '@/lib/db'
import { useToast } from './Toast'
import { downloadCSV, printReport, todayStamp } from '@/lib/export'

const TIPO_LABELS = {
  entrada:   'Entrada / Compra',
  salida:    'Salida / Cocina',
  nuevo:     'Alta de Insumo',
  eliminado: 'Baja de Insumo',
  edicion:   'Ajuste Manual',
}

function formatDate(iso) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function Registros({ userRole }) {
  const toast = useToast()
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState('all')

  async function load(tipo = tipoFilter) {
    setLoading(true)
    try {
      const data = await getMovimientos(tipo)
      setMovimientos(data)
    } catch {
      toast('Error al cargar registros', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tipoFilter]) // eslint-disable-line

  async function handleClear() {
    if (userRole !== 'admin') {
      toast('Acceso denegado: solo administradores pueden vaciar el historial', 'error')
      return
    }
    if (!confirm('¿Eliminar todo el historial de movimientos? Esta acción no se puede deshacer.')) return
    try {
      await clearMovimientos()
      setMovimientos([])
      toast('Historial limpiado correctamente', 'info')
    } catch {
      toast('Error al limpiar historial', 'error')
    }
  }

  const exportHeaders = ['Fecha', 'Hora', 'Tipo', 'Insumo / Producto', 'Detalle', 'Cantidad anterior', 'Cantidad nueva', 'Variación', 'Usuario']
  const exportRows = () => movimientos.map(m => {
    const { date, time } = formatDate(m.created_at)
    const delta = m.cantidad_nueva != null && m.cantidad_anterior != null ? m.cantidad_nueva - m.cantidad_anterior : ''
    return [date, time, TIPO_LABELS[m.tipo] || m.tipo, m.producto_nombre, m.detalle || '', m.cantidad_anterior ?? '', m.cantidad_nueva ?? '', delta, m.usuario_email || '']
  })

  function handleExcel() {
    if (!movimientos.length) return toast('No hay movimientos para exportar', 'info')
    downloadCSV(`foodies-movimientos-${todayStamp()}.csv`, exportHeaders, exportRows())
    toast('Historial descargado (Excel)', 'success')
  }

  function handlePDF() {
    if (!movimientos.length) return toast('No hay movimientos para exportar', 'info')
    const ok = printReport(
      'Historial de Movimientos',
      `${TIPO_LABELS[tipoFilter] || 'Todos los movimientos'} · ${movimientos.length} registros`,
      exportHeaders,
      exportRows()
    )
    if (!ok) toast('El navegador bloqueó la ventana emergente. Permítela para generar el PDF.', 'error')
  }

  // Summary counts
  const counts = movimientos.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + 1
    return acc
  }, {})

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Historial de Cocina, Despachos y Entradas</h2>
        <div className="log-filters">
          <select
            className="log-filter-select"
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
          >
            <option value="all">Todos los movimientos</option>
            <option value="entrada">Entradas / Compras de Insumos</option>
            <option value="salida">Salidas / Consumos de Cocina</option>
            <option value="nuevo">Altas de Insumos</option>
            <option value="eliminado">Bajas de Insumos</option>
            <option value="edicion">Ajustes de Inventario</option>
          </select>
          <button className="filter-btn" onClick={handleExcel}>⬇ Excel</button>
          <button className="filter-btn" onClick={handlePDF}>🖨 PDF</button>
          {userRole === 'admin' && (
            <button className="btn-danger-sm" onClick={handleClear} title="Solo administradores">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      {movimientos.length > 0 && (
        <div className="log-summary">
          <div className="log-chip">Total <span>{movimientos.length}</span></div>
          {Object.entries(counts).map(([tipo, n]) => (
            <div key={tipo} className="log-chip">
              {TIPO_LABELS[tipo] || tipo} <span>{n}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="log-table-wrapper">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            </svg>
            <p>Cargando registros de cocina…</p>
          </div>
        </div>
      ) : movimientos.length === 0 ? (
        <div className="log-table-wrapper">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <p>No hay movimientos registrados en cocina.</p>
          </div>
        </div>
      ) : (
        <div className="log-table-wrapper">
          <table className="log-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Tipo</th>
                <th>Insumo / Producto</th>
                <th>Detalle / Lote</th>
                <th>Cantidad</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => {
                const { date, time } = formatDate(m.created_at)
                const delta = m.cantidad_nueva != null && m.cantidad_anterior != null
                  ? m.cantidad_nueva - m.cantidad_anterior
                  : null

                return (
                  <tr key={m.id}>
                    <td>
                      <span className="log-date">{date}</span>
                      <span className="log-time">{time}</span>
                    </td>
                    <td>
                      <span className={`tipo-badge ${m.tipo}`}>
                        {TIPO_LABELS[m.tipo] || m.tipo}
                      </span>
                    </td>
                    <td className="log-producto">{m.producto_nombre}</td>
                    <td className="log-detalle">{m.detalle || '—'}</td>
                    <td>
                      {delta != null ? (
                        <span className={`log-qty ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'neu'}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      ) : (
                        <span className="log-qty neu">—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {m.usuario_email ? m.usuario_email.split('@')[0] : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
