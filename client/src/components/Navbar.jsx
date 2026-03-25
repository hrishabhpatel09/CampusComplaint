import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { notifAPI } from '../api'

const ROLE_ICONS = { student: '🎓', staff: '🔧', admin: '👑' }

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs]   = useState(false)
  const [notifications, setNotifs]    = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef(null)

  useEffect(() => {
    fetchNotifs()
    // Poll every 30s for new notifications
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifs = async () => {
    try {
      const { data } = await notifAPI.getAll()
      setNotifs(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch { /* silent */ }
  }

  const markRead = async id => {
    try {
      await notifAPI.markRead(id)
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      await notifAPI.markAllRead()
      setNotifs(ns => ns.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  const handleLogout = () => {
    logout()
    toast.success('Signed out!')
    navigate('/login')
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', height: '57px',
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
        Campus<span style={{ color: 'var(--accent)' }}>Fix</span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} ref={panelRef}>
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)', padding: '6px', position: 'relative' }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: 'var(--red)', color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div className="notif-panel" style={{ position: 'absolute', top: '44px', right: 0, left: 'auto', width: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px' }}>Notifications</span>
                {unreadCount > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer' }}>Mark all read</button>}
              </div>
              {notifications.length === 0
                ? <div className="empty-state" style={{ padding: '2rem' }}><div style={{ fontSize: '1.5rem' }}>🔕</div><div className="empty-text">No notifications yet</div></div>
                : notifications.map(n => (
                  <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.message}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid rgba(240,165,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>
            {ROLE_ICONS[user?.role]}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  )
}
