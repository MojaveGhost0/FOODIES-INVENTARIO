'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutTimer, setLockoutTimer] = useState(0)
  const router = useRouter()

  // Si el usuario ya está autenticado, redirigir directamente al panel
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/')
    })
  }, [router])

  // Temporizador de bloqueo tras múltiples intentos fallidos
  useEffect(() => {
    let interval = null
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [lockoutTimer])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (lockoutTimer > 0) return

    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (authError) {
        const nextAttempts = failedAttempts + 1
        setFailedAttempts(nextAttempts)

        if (nextAttempts >= 5) {
          setLockoutTimer(30)
          setError('Demasiados intentos fallidos por seguridad. Espera 30 segundos antes de reintentar.')
        } else {
          // Mensaje genérico para prevenir enumeración de usuarios
          setError('Correo o contraseña incorrectos.')
        }
        setLoading(false)
      } else {
        setFailedAttempts(0)
        router.push('/')
      }
    } catch {
      setError('Error de conexión al iniciar sesión. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/logo.png" alt="Restaurante & Grill" className="login-logo" />
          <h2>Inventario Gastronómico</h2>
          <p>Control de Cocina, Parrilla y Barra</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={lockoutTimer > 0 || loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={lockoutTimer > 0 || loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || lockoutTimer > 0}
          >
            {lockoutTimer > 0 
              ? `Bloqueado (${lockoutTimer}s)` 
              : loading 
                ? 'Verificando...' 
                : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
