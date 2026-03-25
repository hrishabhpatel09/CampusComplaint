import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { complaintsAPI } from '../../api'
import ComplaintModal from '../../components/ComplaintModal'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CAT_CLASS  = { 'Hostel Maintenance':'badge-hostel','Classroom Equipment':'badge-classroom','Internet / WiFi':'badge-internet','Sanitation':'badge-sanitation','Other':'badge-other' }
const STAT_CLASS = { 'Pending':'badge-pending','In Progress':'badge-progress','Resolved':'badge-resolved' }

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterCat, setFilterCat]       = useState('All')

  useEffect(() => {
    complaintsAPI.getMine()
      .then(r => setComplaints(r.data))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const matchSearch = !search || c.description.toLowerCase().includes(search.toLowerCase()) || String(c.id).includes(search)
      const matchStatus = filterStatus === 'All' || c.status === filterStatus
      const matchCat    = filterCat === 'All' || c.category === filterCat
      return matchSearch && matchStatus && matchCat
    }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
  }, [complaints, search, filterStatus, filterCat])

  const exportCSV = () => {
    const rows = [['ID','Category','Description','Location','Priority','Status','Date']]
    filtered.forEach(c => rows.push([
      `#${c.id}`, c.category, c.description, c.location || '—',
      c.priority, c.status, c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '—',
    ]))
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `my-complaints-${Date.now()}.csv`; a.click()
    toast.success('CSV exported!')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica','bold')
    doc.setFontSize(16)
    doc.text('CampusFix — My Complaints Report', 14, 18)
    doc.setFontSize(10); doc.setFont('helvetica','normal')
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 26)
    autoTable(doc, {
      startY: 32,
      head: [['#','Category','Description','Priority','Status','Date']],
      body: filtered.map(c => [
        `#${c.id}`, c.category,
        c.description.length > 50 ? c.description.slice(0,50)+'…' : c.description,
        c.priority, c.status,
        c.created_at ? format(new Date(c.created_at), 'dd MMM yy') : '—',
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [240, 165, 0], textColor: [0,0,0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })
    doc.save(`my-complaints-${Date.now()}.pdf`)
    toast.success('PDF report downloaded!')
  }

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title">My Complaints</div>
        <div className="page-sub">{complaints.length} complaints filed · {complaints.filter(c=>c.status==='Resolved').length} resolved</div>
      </div>

      {/* Toolbar */}
      <div className="search-row fade-up-1">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by ID or description…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-sel" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option>All</option><option>Pending</option><option>In Progress</option><option>Resolved</option>
        </select>
        <select className="filter-sel" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option>All</option><option>Hostel Maintenance</option><option>Classroom Equipment</option><option>Internet / WiFi</option><option>Sanitation</option><option>Other</option>
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
              <tr><th>#</th><th>Category</th><th>Description</th><th>Location</th><th>Priority</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:'12px' }}>#{c.id}</td>
                  <td><span className={`badge ${CAT_CLASS[c.category]||'badge-other'}`}>{c.category}</span></td>
                  <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</td>
                  <td style={{ color:'var(--text-muted)', fontSize:'13px' }}>{c.location || '—'}</td>
                  <td><span className={`pri-${c.priority?.toLowerCase()}`}>● {c.priority}</span></td>
                  <td style={{ color:'var(--text-muted)', fontSize:'13px', whiteSpace:'nowrap' }}>{c.created_at ? format(new Date(c.created_at),'dd MMM yy') : '—'}</td>
                  <td><span className={`badge ${STAT_CLASS[c.status]||'badge-pending'}`}>{c.status}</span></td>
                  <td><button className="btn btn-info btn-sm" onClick={() => setSelected(c)}>Track</button></td>
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
