import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { complaintsAPI, usersAPI } from '../../api'
import ComplaintModal from '../../components/ComplaintModal'
import { format } from 'date-fns'

const CAT_CLASS  = { 'Hostel Maintenance':'badge-hostel','Classroom Equipment':'badge-classroom','Internet / WiFi':'badge-internet','Sanitation':'badge-sanitation','Other':'badge-other' }
const STAT_CLASS = { 'Pending':'badge-pending','In Progress':'badge-progress','Resolved':'badge-resolved' }

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [staff, setStaff]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [assigning, setAssigning]   = useState({}) // { [id]: staffId }
  const [saving, setSaving]         = useState(null)

  useEffect(() => {
    Promise.all([
      complaintsAPI.getAll(),
      usersAPI.getStaff(),
    ]).then(([cr, sr]) => {
      setComplaints(cr.data)
      setStaff(sr.data)
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    pending:    complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved:   complaints.filter(c => c.status === 'Resolved').length,
    total:      complaints.length,
  }

  const unassigned = complaints.filter(c => !c.assigned_to && c.status === 'Pending')
  const recent     = [...complaints].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)

  const handleAssign = async (id) => {
    const staffId = assigning[id]
    if (!staffId) return toast.error('Select a staff member first')
    setSaving(id)
    try {
      await complaintsAPI.assign(id, { assigned_to: staffId, status: 'In Progress' })
      const staffName = staff.find(s => s.id === Number(staffId))?.name || 'Staff'
      toast.success(`Assigned to ${staffName}!`)
      setComplaints(cs => cs.map(c => c.id === id
        ? { ...c, assigned_to: Number(staffId), assigned_name: staffName, status: 'In Progress' }
        : c
      ))
    } catch { toast.error('Assignment failed') }
    finally { setSaving(null) }
  }

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title">Admin Overview 👑</div>
        <div className="page-sub">Campus-wide complaint management dashboard.</div>
      </div>

      {/* Stats */}
      <div className="stat-grid fade-up-1">
        <div className="stat-card stat-yellow"><div className="glow"/><div className="num">{counts.pending}</div><div className="lbl">Pending</div></div>
        <div className="stat-card stat-blue">  <div className="glow"/><div className="num">{counts.inProgress}</div><div className="lbl">In Progress</div></div>
        <div className="stat-card stat-green"> <div className="glow"/><div className="num">{counts.resolved}</div><div className="lbl">Resolved</div></div>
        <div className="stat-card stat-red">   <div className="glow"/><div className="num">{counts.total}</div><div className="lbl">Total</div></div>
      </div>

      {/* Unassigned complaints */}
      <div className="sec-head fade-up-2">
        <span className="sec-title">⚠️ Unassigned Complaints</span>
        <span style={{ fontSize:'13px', color:'var(--red)' }}>{unassigned.length} need assignment</span>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}><div className="spinner"/></div>
      ) : unassigned.length === 0 ? (
        <div className="card fade-up-2" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'14px' }}>
          🎉 All complaints are assigned!
        </div>
      ) : (
        <div className="table-wrap fade-up-2" style={{ marginBottom:'2rem' }}>
          <table>
            <thead>
              <tr><th>#</th><th>Category</th><th>Description</th><th>Priority</th><th>Date</th><th>Assign To</th><th>Action</th></tr>
            </thead>
            <tbody>
              {unassigned.map(c => (
                <tr key={c.id}>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:'12px' }}>#{c.id}</td>
                  <td><span className={`badge ${CAT_CLASS[c.category]||'badge-other'}`}>{c.category}</span></td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</td>
                  <td><span className={`pri-${c.priority?.toLowerCase()}`}>● {c.priority}</span></td>
                  <td style={{ fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                    {c.created_at ? format(new Date(c.created_at), 'dd MMM') : '—'}
                  </td>
                  <td>
                    <select
                      className="filter-sel"
                      style={{ fontSize:'12px', padding:'5px 10px' }}
                      value={assigning[c.id] || ''}
                      onChange={e => setAssigning(a => ({ ...a, [c.id]: e.target.value }))}
                    >
                      <option value="">Select staff…</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={saving === c.id || !assigning[c.id]}
                      onClick={() => handleAssign(c.id)}
                    >
                      {saving === c.id ? '…' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent activity */}
      <div className="sec-head fade-up-3">
        <span className="sec-title">Recent Activity</span>
        <Link to="/admin/complaints" style={{ fontSize:'13px', color:'var(--accent)', textDecoration:'none' }}>View all →</Link>
      </div>

      <div className="table-wrap fade-up-3">
        <table>
          <thead>
            <tr><th>#</th><th>Category</th><th>Description</th><th>Assigned To</th><th>Date</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {recent.map(c => (
              <tr key={c.id}>
                <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:'12px' }}>#{c.id}</td>
                <td><span className={`badge ${CAT_CLASS[c.category]||'badge-other'}`}>{c.category}</span></td>
                <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</td>
                <td style={{ fontSize:'13px', color: c.assigned_name ? 'var(--text)' : 'var(--text-muted)' }}>
                  {c.assigned_name || '—'}
                </td>
                <td style={{ fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                  {c.created_at ? format(new Date(c.created_at), 'dd MMM') : '—'}
                </td>
                <td><span className={`badge ${STAT_CLASS[c.status]||'badge-pending'}`}>{c.status}</span></td>
                <td><button className="btn btn-ghost btn-xs" onClick={() => setSelected(c)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <ComplaintModal complaint={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
