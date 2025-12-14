import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Logo } from '@/components/admin/logo'
import '@/styles/admin-login.css'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, login } = useAdminAuth()

  const redirectTo = location.state?.from?.pathname || '/admin'

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [authLoading, user, navigate, redirectTo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('Login failed:', err)
      setError(
        err?.message || 'Unable to sign in. Please check your credentials.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || user) {
    return (
      <div className="admin-login__loading">
        <span>Preparing secure access...</span>
      </div>
    )
  }

  return (
    <div className="admin-login__page">
      <div className="admin-login__gradient" />
      <div className="admin-login__mesh" />
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <Logo className="h-10 w-10" />
          <div>
            <p className="admin-login__brand">Astari Golf Admin</p>
            <p className="admin-login__subtitle">Secure access portal</p>
          </div>
        </div>
        <h1 className="admin-login__title">Welcome back</h1>
        <p className="admin-login__description">
          Sign in with your administrator credentials to continue.
        </p>
        <form className="admin-login__form" onSubmit={handleSubmit}>
          {error && <div className="admin-login__error">{error}</div>}
          <label className="admin-login__label" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            className="admin-login__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@astarigolf.com"
            autoComplete="email"
            required
            disabled={loading}
          />
          <label className="admin-login__label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className="admin-login__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="admin-login__button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Access Dashboard'}
          </button>
        </form>
        <p className="admin-login__help">Questions? Contact your team lead.</p>
      </div>
    </div>
  )
}

export default AdminLogin
