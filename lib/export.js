// ─── Utilidades de exportación (sin dependencias externas) ───────────────────

// Previene inyección de fórmulas en Excel (CSV injection)
function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Descarga un archivo .csv compatible con Excel (UTF-8 con BOM, separador ';').
 */
export function downloadCSV(filename, headers, rows) {
  const lines = [headers, ...rows].map(r => r.map(csvCell).join(';'))
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Abre una ventana con el reporte formateado y lanza el diálogo de impresión
 * (el usuario elige "Guardar como PDF").
 */
export function printReport(title, subtitle, headers, rows) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return false

  const head = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')
  const body = rows
    .map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('')

  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:32px}
  .brand{display:flex;align-items:center;gap:14px;border-bottom:4px solid #ff5500;padding-bottom:12px;margin-bottom:18px}
  .brand img{width:56px;height:56px;border-radius:14px;object-fit:cover}
  .brand h1{margin:0;font-size:22px;color:#ff5500}
  .brand p{margin:2px 0 0;font-size:12px;color:#666}
  h2{font-size:16px;margin:0 0 4px}
  .sub{font-size:12px;color:#666;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#ff5500;color:#fff;text-align:left;padding:8px;font-weight:700}
  td{padding:7px 8px;border-bottom:1px solid #e5e5e5}
  tr:nth-child(even) td{background:#fff6f0}
  .foot{margin-top:18px;font-size:11px;color:#888;text-align:right}
  @media print{body{margin:14mm}}
</style></head><body>
  <div class="brand">
    <img src="${window.location.origin}/logo.png" alt="Foodies">
    <div><h1>Foodies</h1><p>Sistema de Inventario Gastronómico</p></div>
  </div>
  <h2>${escapeHtml(title)}</h2>
  <div class="sub">${escapeHtml(subtitle)}</div>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  <div class="foot">Generado el ${escapeHtml(new Date().toLocaleString('es-VE'))}</div>
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print()},350)}<\/script>
</body></html>`)
  win.document.close()
  return true
}
