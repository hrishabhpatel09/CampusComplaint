import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { complaintsAPI } from '../../api'
import ComplaintModal from '../../components/ComplaintModal'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CAT_CLASS  = { 'Hostel Maintenance':'badge-hostel','Classroom Equipment':'badge-classroom','Internet / WiFi':'badge-internet','Sanitation':'badge-sanitation','Other':'badge-other' }
const STAT_CLASS = { 'Pending':'badge-pending','In Progress':'badge-progress','Resolved':'badge-resolved' }

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterCat, setFilterCat]       = useState('All')
  const [filterPri, setFilterPri]       = useState('All')

  useEffect(() => {
    complaintsAPI.getAll()
      .then(r => setComplaints(r.data))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !search
        || c.description?.toLowerCase().includes(q)
        || String(c.id).includes(q)
        || c.assigned_name?.toLowerCase().includes(q)
        || c.student_name?.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'All' || c.status === filterStatus
      const matchCat    = filterCat === 'All'    || c.category === filterCat
      const matchPri    = filterPri === 'All'    || c.priority === filterPri
      return matchSearch && matchStatus && matchCat && matchPri
    }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
  }, [complaints, search, filterStatus, filterCat, filterPri])

  const exportCSV = () => {
    const rows = [['ID','Student','Category','Description','Location','Priority','Assigned To','Status','Date']]
    filtered.forEach(c => rows.push([
      `#${c.id}`, c.student_name||'—', c.category,
      c.description, c.location||'—', c.priority,
      c.assigned_name||'Unassigned', c.status,
      c.created_at ? format(new Date(c.created_at),'dd MMM yyyy') : '—',
    ]))
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `all-complaints-${Date.now()}.csv`; a.click()
    toast.success('CSV exported!')
  }

  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    doc.setFont('helvetica','bold'); doc.setFontSize(18)
    doc.text('CampusFix — All Complaints Report', 14, 18)
    doc.setFont('helvetica','normal'); doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(),'dd MMM yyyy, hh:mm a')}  |  Total: ${filtered.length} complaints`, 14, 26)
    autoTable(doc, {
      startY: 32,
      head: [['#','Student','Category','Description','Priority','Assigned','Status','Date']],
      body: filtered.map(c => [
        `#${c.id}`, c.student_name||'—', c.category,
        c.description?.length > 40 ? c.description.slice(0,40)+'…' : c.description,
        c.priority, c.assigned_name||'—', c.status,
        c.created_at ? format(new Date(c.created_at),'dd MMM yy') : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [240,165,0], textColor: [0,0,0] },
      alternateRowStyles: { fillColor: [245,245,245] },
    })
    doc.save(`all-complaints-${Date.now()}.pdf`)
    toast.success('PDF report downloaded!')
  }

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom:'1.5rem' }}>
        <div className="page-title">All Complaints</div>
        <div className="page-sub">{complaints.length} total · {filtered.length} showing</div>
      </div>

      {/* Toolbar */}
      <div className="search-row fade-up-1">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search ID, description, student, staff…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-sel" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option>All</option><option>Pending</option><option>In Progress</option><option>Resolved</option>
        </select>
        <select className="filter-sel" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option>All</option><option>Hostel Maintenance</option><option>Classroom Equipment</option>
          <option>Internet / WiFi</option><option>Sanitation</option><option>Other</option>
        </select>
        <select className="filter-sel" value={filterPri} onChange={e=>setFilterPri(e.target.value)}>
          <option>All</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ CSV</button>
        <button className="btn btn-ghost btn-sm" onClick={exportPDF}>📄 PDF</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner"/></div>
      ) : filtered.length === 0 ? (
        <div className="table-wrap"><div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-text">No complaints match your filters.</div></div></div>
      ) : (
        <div className="table-wrap fade-up-2">
          <table>
            <thead>
              <tr><th>#</th><th>Student</th><th>Category</th><th>Description</th><th>Priority</th><th>Assigned To</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:'12px' }}>#{c.id}</td>
                  <td style={{ fontSize:'13px', whiteSpace:'nowrap' }}>{c.student_name || '—'}</td>
                  <td><span className={`badge ${CAT_CLASS[c.category]||'badge-other'}`}>{c.category}</span></td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</td>
                  <td><span className={`pri-${c.priority?.toLowerCase()}`}>● {c.priority}</span></td>
                  <td style={{ fontSize:'13px', color: c.assigned_name ? 'var(--text)' : 'var(--text-muted)' }}>
                    {c.assigned_name || <span style={{ fontStyle:'italic' }}>Unassigned</span>}
                  </td>
                  <td style={{ fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                    {c.created_at ? format(new Date(c.created_at),'dd MMM yy') : '—'}
                  </td>
                  <td><span className={`badge ${STAT_CLASS[c.status]||'badge-pending'}`}>{c.status}</span></td>
                  <td><button className="btn btn-ghost btn-xs" onClick={() => setSelected(c)}>View</button></td>
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
