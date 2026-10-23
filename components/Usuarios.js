'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './Toast'

export default function Usuarios() {
  const toast = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsuarios(data)
    } catch (error) {
      toast('Error al cargar usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'usuario' : 'admin'
    
    // Evitar que el admin se quite el rol a sí mismo
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id === id && newRole === 'usuario') {
      toast('No puedes quitarte el rol de admin a ti mismo', 'error')
      return
    }

    // Evitar degradar al único administrador existente en el sistema
    const totalAdmins = usuarios.filter(u => u.rol === 'admin').length
    if (currentRole === 'admin' && newRole === 'usuario' && totalAdmins <= 1) {
      toast('Operación denegada: Debe haber al menos un administrador en el sistema', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ rol: newRole })
        .eq('id', id)
      
      if (error) {
        toast(error.message || 'Error al actualizar rol', 'error')
        return
      }
      
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: newRole } : u))
      toast(`Rol cambiado a "${newRole}" correctamente`, 'success')
    } catch (error) {
      toast('Error al actualizar rol', 'error')
    }
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Gestión de Usuarios</h2>
      </div>

      <div className="log-table-wrapper" style={{ marginTop: '2rem' }}>
        <table className="log-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol Actual</th>
              <th>Fecha Registro</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent-dim)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Cargando usuarios...
                  </div>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <p style={{ fontSize: '15px' }}>No se encontraron usuarios registrados.</p>
                </td>
              </tr>
            ) : (
              usuarios.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', 
                        borderRadius: 'var(--r-md)', 
                        background: 'var(--bg-elevated)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent)', fontWeight: 'bold',
                        border: '1px solid var(--border)'
                      }}>
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>
                          {user.email.split('@')[0]}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`stock-pill ${user.rol === 'admin' ? 'ok' : 'normal'}`}>
                      <span className="stock-pill-dot" />
                      {user.rol}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(user.created_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-edit" 
                      onClick={() => handleRoleChange(user.id, user.rol)}
                      style={{ 
                        padding: '8px 16px', 
                        background: user.rol === 'admin' ? 'var(--bg-elevated)' : 'var(--accent)', 
                        color: user.rol === 'admin' ? 'var(--text-secondary)' : '#fff',
                        border: user.rol === 'admin' ? '1px solid var(--border)' : 'none',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      {user.rol === 'admin' ? 'Hacer Usuario' : 'Hacer Admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
