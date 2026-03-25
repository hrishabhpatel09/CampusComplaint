import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { complaintsAPI } from '../../api'
import ComplaintModal from '../../components/ComplaintModal'
import { format } from 'date-fns'

const CAT_CLASS  = { 'Hostel Maintenance':'badge-hostel','Classroom Equipment':'badge-classroom','Internet / WiFi':'badge-internet','Sanitation':'badge-sanitation','Other':'badge-other' }
const STAT_CLASS = { 'Pending':'badge-pending','In Progress':'badge-progress','Resolved':'badge-resolved' }

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [updating, setUpdating]     = useState(null)

  const fetchAssigned = () => {
    complaintsAPI.getAll({ assignedToMe: true })
      .then(r => setComplaints(r.data.filter(c => c.status !== 'Resolved')))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAssigned() }, [])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await complaintsAPI.update(id, { status })
      toast.success(`Status updated to "${status}"`)
      setComplaints(cs => status === 'Resolved'
        ? cs.filter(c => c.id !== id)
        : cs.map(c => c.id === id ? { ...c, status } : c)
      )
    } catch { toast.error('Update failed') }
    finally { setUpdating(null) }
  }

  const open = complaints.length
  const high = complaints.filter(c => c.priority === 'High').length

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title">My Assignments 🔧</div>
        <div className="page-sub">Complaints assigned to you that need attention.</div>
      </div>

      {/* Mini stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }} className="fade-up-1">
        <div className="stat-card stat-yellow"><div className="glow"/><div className="num">{open}</div><div className="lbl">Open Tasks</div></div>
        <div className="stat-card stat-red"><div className="glow"/><div className="num">{high}</div><div className="lbl">High Priority</div></div>
        <div className="stat-card stat-blue"><div className="glow"/><div className="num">{complaints.filter(c=>c.status==='In Progress').length}</div><div className="lbl">In Progress</div></div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner"/></div>
      ) : complaints.length === 0 ? (
        <div className="table-wrap"><div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-text">All clear! No open assignments.</div></div></div>
      ) : (
        <div className="table-wrap fade-up-2">
          <table>
            <thead>
              <tr><th>#</th><th>Category</th><th>Location</th><th>Description</th><th>Priority</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:'12px' }}>#{c.id}</td>
                  <td><span className={`badge ${CAT_CLASS[c.category]||'badge-other'}`}>{c.category}</span></td>
                  <td style={{ fontSize:'13px', color:'var(--text-muted)' }}>{c.location || '—'}</td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</td>
                  <td><span className={`pri-${c.priority?.toLowerCase()}`}>● {c.priority}</span></td>
                  <td style={{ fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{c.created_at ? format(new Date(c.created_at),'dd MMM') : '—'}</td>
                  <td><span className={`badge ${STAT_CLASS[c.status]||'badge-pending'}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setSelected(c)}>View</button>
                      {c.status === 'Pending' && (
                        <button className="btn btn-info btn-xs" disabled={updating===c.id} onClick={() => updateStatus(c.id, 'In Progress')}>
                          {updating===c.id ? '…' : 'Start'}
                        </button>
                      )}
                      {c.status !== 'Resolved' && (
                        <button className="btn btn-success btn-xs" disabled={updating===c.id} onClick={() => updateStatus(c.id, 'Resolved')}>
                          {updating===c.id ? '…' : 'Resolve ✓'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <ComplaintModal complaint={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
