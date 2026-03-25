import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { complaintsAPI } from '../../api'
import ComplaintModal from '../../components/ComplaintModal'
import { format } from 'date-fns'

const CAT_CLASS = { 'Hostel Maintenance':'badge-hostel','Classroom Equipment':'badge-classroom','Internet / WiFi':'badge-internet','Sanitation':'badge-sanitation','Other':'badge-other' }

export default function StaffResolved() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)

  useEffect(() => {
    complaintsAPI.getAll({ assignedToMe: true })
      .then(r => setComplaints(r.data.filter(c => c.status === 'Resolved')))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title">Resolved Complaints ✅</div>
        <div className="page-sub">{complaints.length} issues closed by you.</div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner"/></div>
      ) : complaints.length === 0 ? (
        <div className="table-wrap"><div className="empty-state"><div className="empty-icon">📂</div><div className="empty-text">No resolved complaints yet.</div></div></div>
      ) : (
        <div className="table-wrap fade-up-1">
          <table>
            <thead>
              <tr><th>#</th><th>Category</th><th>Description</th><th>Location</th><th>Submitted</th><th>Action</th></tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:'12px' }}>#{c.id}</td>
                  <td><span className={`badge ${CAT_CLASS[c.category]||'badge-other'}`}>{c.category}</span></td>
                  <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</td>
                  <td style={{ fontSize:'13px', color:'var(--text-muted)' }}>{c.location || '—'}</td>
                  <td style={{ fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                    {c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setSelected(c)}>View</button></td>
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
