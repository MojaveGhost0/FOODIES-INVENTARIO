'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ToastProvider } from '@/components/Toast'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import Registros from '@/components/Registros'
import AgregarProducto from '@/components/AgregarProducto'
import Usuarios from '@/components/Usuarios'
import ListaCompras from '@/components/ListaCompras'
import { getProductos } from '@/lib/db'

const PAGE_INFO = {
  dashboard: {
    title: 'Control de Cocina & Barra',
    subtitle: 'Inventario de carnes, comida árabe, comida rápida y bebidas en tiempo real',
  },
  compras: {
    title: 'Lista de Compras',
    subtitle: 'Reposición sugerida automática según stock mínimo, lista para enviar al proveedor',
  },
  registros: {
    title: 'Historial de Despachos y Entradas',
    subtitle: 'Registro de consumos en cocina, mermas, restocks y recepción de proveedores',
  },
  agregar: {
    title: 'Registrar Insumo / Producto',
    subtitle: 'Nuevo corte de carne, insumos de cocina o bebidas',
  },
  usuarios: {
    title: 'Personal & Accesos',
    subtitle: 'Administra roles para cocineros, encargados y administradores',
  }
}

function DateBadge() {
  const [date, setDate] = useState('')
  useEffect(() => {
    const d = new Date()
    setDate(d.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }))
  }, [])
  return (
    <div className="date-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {date}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [productos, setProductos]  = useState([])
  const [loading, setLoading]      = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ── SEGURIDAD: Verificar sesión activa con validación de servidor ──
  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          if (isMounted) {
            setSession(null)
            setUserRole(null)
            setAuthChecking(false)
            router.push('/login')
          }
          return
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (isMounted) {
          setSession(currentSession)
        }

        // Obtener rol seguro desde perfiles
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (isMounted) {
          setUserRole(perfil?.rol || 'usuario')
          setAuthChecking(false)
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err)
        if (isMounted) {
          setAuthChecking(false)
          router.push('/login')
        }
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!newSession) {
        setSession(null)
        setUserRole(null)
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', newSession.user.id)
          .single()
        if (perfil) setUserRole(perfil.rol)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const loadProductos = useCallback(async () => {
    if (!session) return // No cargar si no hay sesión
    try {
      setLoading(true)
      const data = await getProductos()
      setProductos(data)
    } catch (err) {
      console.error('Error cargando productos:', err?.message || err)
      if (err.details) console.error('Details:', err.details)
      if (err.hint) console.error('Hint:', err.hint)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      loadProductos()
    }
  }, [session, loadProductos])

  if (authChecking) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Foodies Logo" 
            style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '22px', zIndex: 10, boxShadow: '0 8px 24px rgba(255, 85, 0, 0.35)' }}
          />
          <div style={{ 
            position: 'absolute', width: '114px', height: '114px', 
            border: '3px solid transparent', borderTopColor: 'var(--accent)', 
            borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' 
          }} />
        </div>
        <h2 style={{ marginTop: '24px', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.06em' }}>FOODIES</h2>
        <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Iniciando Sistema de Inventario...</p>
      </div>
    )
  }

  if (!session) {
    return null // Evitar flash UI antes del redirect
  }

  const totalUnidades = productos.reduce((s, p) => s + (p.cantidad || 0), 0)
  const info = PAGE_INFO[activeTab]

  return (
    <ToastProvider>
      <div className="app-layout">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalProductos={productos.length}
          totalUnidades={totalUnidades}
          userRole={userRole}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Main */}
        <div className="main-content">
          {/* Top bar */}
          <header className="topbar">
            <div className="topbar-left">
              <button 
                className="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div>
                <h1 className="page-title">{info.title}</h1>
                <p className="page-subtitle">{info.subtitle}</p>
              </div>
            </div>
            <div className="topbar-right">
              <DateBadge />
            </div>
          </header>

          {/* Tab content */}
          {activeTab === 'dashboard' && (
            <Dashboard
              productos={productos}
              setProductos={setProductos}
              loading={loading}
              onTabChange={setActiveTab}
              userRole={userRole}
            />
          )}
          {activeTab === 'compras' && <ListaCompras productos={productos} loading={loading} />}
          {activeTab === 'registros' && <Registros userRole={userRole} />}
          {activeTab === 'agregar' && userRole === 'admin' && (
            <AgregarProducto
              productos={productos}
              setProductos={setProductos}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'usuarios' && userRole === 'admin' && <Usuarios />}
        </div>
      </div>
    </ToastProvider>
  )
}
