import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { complaintsAPI } from '../../api'
import ComplaintModal from '../../components/ComplaintModal'
import { format } from 'date-fns'

const CAT_CLASS  = { 'Hostel Maintenance':'badge-hostel','Classroom Equipment':'badge-classroom','Internet / WiFi':'badge-internet','Sanitation':'badge-sanitation','Other':'badge-other' }
const STAT_CLASS = { 'Pending':'badge-pending','In Progress':'badge-progress','Resolved':'badge-resolved' }

export default function StudentDashboard() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)

  useEffect(() => {
    complaintsAPI.getMine()
      .then(r => setComplaints(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    pending:    complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved:   complaints.filter(c => c.status === 'Resolved').length,
    total:      complaints.length,
  }

  const recent = [...complaints].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5)

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: '1.75rem' }} className="fade-up">
        <div className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
        <div className="page-sub">Here's a summary of your complaints.</div>
      </div>

      {/* Stats */}
      <div className="stat-grid fade-up-1">
        <div className="stat-card stat-yellow"><div className="glow" /><div className="num">{counts.pending}</div><div className="lbl">Pending</div></div>
        <div className="stat-card stat-blue">  <div className="glow" /><div className="num">{counts.inProgress}</div><div className="lbl">In Progress</div></div>
        <div className="stat-card stat-green"> <div className="glow" /><div className="num">{counts.resolved}</div><div className="lbl">Resolved</div></div>
        <div className="stat-card stat-red">   <div className="glow" /><div className="num">{counts.total}</div><div className="lbl">Total Filed</div></div>
      </div>

      {/* Recent */}
      <div className="sec-head fade-up-2">
        <span className="sec-title">Recent Complaints</span>
        <Link to="/student/my" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : recent.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No complaints yet.</div>
            <Link to="/student/submit" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Submit one now</Link>
          </div>
        </div>
      ) : (
        <div className="table-wrap fade-up-2">
          <table>
            <thead>
              <tr><th>#</th><th>Category</th><th>Description</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {recent.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>#{c.id}</td>
                  <td><span className={`badge ${CAT_CLASS[c.category] || 'badge-other'}`}>{c.category}</span></td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{c.created_at ? format(new Date(c.created_at), 'dd MMM') : '—'}</td>
                  <td><span className={`badge ${STAT_CLASS[c.status] || 'badge-pending'}`}>{c.status}</span></td>
                  <td>
                    <button className="btn btn-info btn-sm" onClick={() => setSelected(c)}>Track</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="fade-up-3">
        <Link to="/student/submit" className="btn btn-primary">➕ New Complaint</Link>
        <Link to="/student/my"     className="btn btn-ghost">📋 All My Complaints</Link>
      </div>

      {selected && <ComplaintModal complaint={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
