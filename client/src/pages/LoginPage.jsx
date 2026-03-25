import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Demo quick-login shortcuts
  const quickLogin = async (role) => {
    const demos = {
      student: { email: 'student@campus.edu', password: 'demo123' },
      staff:   { email: 'staff@campus.edu',   password: 'demo123' },
      admin:   { email: 'admin@campus.edu',   password: 'demo123' },
    }
    setForm(demos[role])
    await handleSubmit(null, demos[role])
  }

  const handleSubmit = async (e, override) => {
    if (e) e.preventDefault()
    const creds = override || form
    setLoading(true)
    try {
      const { data } = await authAPI.login(creds)
      login(data.user, data.token)
      toast.success(`Welcome back, ${data.user.name}!`)
      const routes = { student: '/student', staff: '/staff', admin: '/admin' }
      navigate(routes[data.user.role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)' }}>
      {/* Background accent */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--accent)', opacity: 0.04, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-150px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--blue)', opacity: 0.04, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="fade-up">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
            Campus<span style={{ color: 'var(--accent)' }}>Fix</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Campus Complaint & Maintenance System</div>
        </div>

        <div className="card fade-up-1">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Sign in to continue</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@campus.edu" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick demo</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {['student','staff','admin'].map(r => (
              <button key={r} className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', textTransform: 'capitalize' }} onClick={() => quickLogin(r)}>
                {r === 'student' ? '🎓' : r === 'staff' ? '🔧' : '👑'} {r}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '14px', color: 'var(--text-muted)' }} className="fade-up-2">
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
