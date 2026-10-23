'use client'
import { useMemo, useState } from 'react'
import { downloadCSV, printReport, todayStamp } from '@/lib/export'
import { useToast } from './Toast'

// Nivel objetivo = 3 veces el stock mínimo (mismo criterio "normal" del dashboard)
const FACTOR_OBJETIVO = 3

function buildItems(productos) {
  return productos
    .map(p => {
      const cantidad = p.cantidad || 0
      const minimo = p.stock_minimo ?? 5
      const objetivo = Math.max(minimo * FACTOR_OBJETIVO, 1)
      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria || 'Otro',
        unidad: p.unidad || 'unidades',
        cantidad,
        minimo,
        objetivo,
        comprar: objetivo - cantidad,
        estado: cantidad <= 0 ? 'Agotado' : 'Por agotarse',
      }
    })
    .filter(i => i.cantidad <= i.minimo)
    .sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === 'Agotado' ? -1 : 1
      return a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)
    })
}

export default function ListaCompras({ productos, loading }) {
  const toast = useToast()
  const [soloAgotados, setSoloAgotados] = useState(false)

  const todos = useMemo(() => buildItems(productos), [productos])
  const items = useMemo(
    () => (soloAgotados ? todos.filter(i => i.estado === 'Agotado') : todos),
    [todos, soloAgotados]
  )

  const agotados = todos.filter(i => i.estado === 'Agotado').length
  const porAgotarse = todos.length - agotados

  const headers = ['Prioridad', 'Insumo / Producto', 'Categoría', 'Stock actual', 'Stock mínimo', 'Nivel óptimo', 'Cantidad a comprar', 'Unidad']
  const rows = items.map(i => [i.estado, i.nombre, i.categoria, i.cantidad, i.minimo, i.objetivo, i.comprar, i.unidad])

  function handleExcel() {
    if (!items.length) return toast('No hay insumos por comprar', 'info')
    downloadCSV(`foodies-lista-compras-${todayStamp()}.csv`, headers, rows)
    toast('Lista de compras descargada (Excel)', 'success')
  }

  function handlePDF() {
    if (!items.length) return toast('No hay insumos por comprar', 'info')
    const ok = printReport(
      'Lista de Compras Sugerida',
      `${items.length} insumos por reponer · ${agotados} agotados`,
      headers,
      rows
    )
    if (!ok) toast('El navegador bloqueó la ventana emergente. Permítela para generar el PDF.', 'error')
  }

  async function handleCopiar() {
    if (!items.length) return toast('No hay insumos por comprar', 'info')
    const lines = [`🛒 *Lista de compras Foodies* — ${todayStamp()}`, '']
    items.forEach(i => {
      lines.push(`${i.estado === 'Agotado' ? '🔴' : '🟠'} ${i.nombre}: ${i.comprar} ${i.unidad}`)
    })
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast('Lista copiada. Pégala en WhatsApp para el proveedor', 'success')
    } catch {
      toast('No se pudo copiar la lista', 'error')
    }
  }

  return (
    <div className="tab-content">
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card blue">
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div>
            <span className="sc-num">{todos.length}</span>
            <span className="sc-label">Insumos por comprar</span>
          </div>
        </div>
        <div className="stat-card red">
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <span className="sc-num" style={agotados > 0 ? { color: '#ef4444' } : {}}>{agotados}</span>
            <span className="sc-label">Urgentes (agotados)</span>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="sc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <span className="sc-num">{porAgotarse}</span>
            <span className="sc-label">Por agotarse</span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Lista de Compras Sugerida</h2>
        <div className="filter-row">
          <button
            className={`filter-btn${soloAgotados ? ' active' : ''}`}
            onClick={() => setSoloAgotados(v => !v)}
          >
            Solo urgentes
          </button>
          <button className="filter-btn" onClick={handleExcel}>⬇ Excel</button>
          <button className="filter-btn" onClick={handlePDF}>🖨 PDF</button>
          <button className="filter-btn" onClick={handleCopiar}>📋 WhatsApp</button>
        </div>
      </div>

      <div className="log-table-wrapper">
        {loading ? (
          <div className="empty-state"><p>Calculando compras sugeridas…</p></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>✅ Todo el inventario está abastecido. No hay compras pendientes.</p>
          </div>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>Prioridad</th>
                <th>Insumo / Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Óptimo</th>
                <th>Comprar</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td>
                    <span className={`tipo-badge ${i.estado === 'Agotado' ? 'eliminado' : 'edicion'}`}>
                      {i.estado}
                    </span>
                  </td>
                  <td className="log-producto">{i.nombre}</td>
                  <td className="log-detalle">{i.categoria}</td>
                  <td>{i.cantidad} {i.unidad}</td>
                  <td>{i.objetivo} {i.unidad}</td>
                  <td><span className="log-qty pos">+{i.comprar} {i.unidad}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
