'use client'

import { supabase } from '@/lib/supabase'

export default function Sidebar({ activeTab, setActiveTab, totalProductos, totalUnidades, userRole, isOpen, setIsOpen }) {
  const baseNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      id: 'registros',
      label: 'Registros',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      ),
    },
  ]

  const adminNavItems = [
    {
      id: 'agregar',
      label: 'Agregar',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    }
  ]

  const navItems = userRole === 'admin' ? [...baseNavItems, ...adminNavItems] : baseNavItems

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleTabClick = (id) => {
    setActiveTab(id)
    if (setIsOpen) setIsOpen(false) // Close sidebar on mobile after selecting
  }

  return (
    <>
      {/* ── Overlay para Mobile ── */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={() => setIsOpen && setIsOpen(false)}
      />

      {/* ── Sidebar Desktop / Mobile Drawer ── */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Foodies" className="logo-img" />
          <div className="sidebar-brand-wrap">
            <span className="sidebar-brand">Foodies</span>
            <span className="sidebar-sub">Inventario & Cocina</span>
          </div>
          {/* Close button inside sidebar on mobile */}
          <button 
            className="mobile-close-btn"
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Áreas de Gestión</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => handleTabClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item btn-logout" onClick={handleLogout} style={{color: '#f87171', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)'}}>
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span className="nav-text">Cerrar Sesión</span>
          </button>
          
          <div className="sidebar-stats-card">
            <div className="ss-item">
              <span className="ss-num">{totalProductos}</span>
              <span className="ss-label">Insumos</span>
            </div>
            <div className="ss-divider" />
            <div className="ss-item">
              <span className="ss-num">{totalUnidades}</span>
              <span className="ss-label">Stock Cocina</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
