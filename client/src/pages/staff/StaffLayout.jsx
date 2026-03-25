import { Outlet, NavLink } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const NAV = [
  { to: '/staff',          end: true, icon: '📋', label: 'Assigned to Me' },
  { to: '/staff/resolved',            icon: '✅', label: 'Resolved'        },
]

export default function StaffLayout() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      <Navbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <aside style={{ width:220, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'1.25rem 0', overflowY:'auto' }}>
          <div style={{ padding:'0 1rem 1rem', fontSize:'11px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.6px' }}>Staff Portal</div>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:'10px',
              padding:'10px 1.25rem', textDecoration:'none', fontSize:'14px', transition:'all 0.15s',
              borderLeft:`3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
            })}>
              <span style={{ fontSize:'15px' }}>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </aside>
        <main style={{ flex:1, overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
