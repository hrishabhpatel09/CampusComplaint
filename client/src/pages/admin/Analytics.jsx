import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { complaintsAPI } from '../../api'
import { format, subDays } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = { 'Hostel Maintenance':'#a78bfa','Classroom Equipment':'#3b82f6','Internet / WiFi':'#f0a500','Sanitation':'#22c55e','Other':'#6b7280' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:13 }}>
      {label && <div style={{ color:'var(--text-muted)', marginBottom:4, fontSize:12 }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ color: p.color || 'var(--text)' }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    complaintsAPI.getAll()
      .then(r => setComplaints(r.data))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  // Category breakdown
  const catData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1; return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // Status breakdown
  const statusData = [
    { name: 'Pending',     value: complaints.filter(c=>c.status==='Pending').length,     fill: '#f0a500' },
    { name: 'In Progress', value: complaints.filter(c=>c.status==='In Progress').length, fill: '#3b82f6' },
    { name: 'Resolved',    value: complaints.filter(c=>c.status==='Resolved').length,    fill: '#22c55e' },
  ]

  // Priority breakdown
  const priData = [
    { name:'High',   value: complaints.filter(c=>c.priority==='High').length,   fill:'#ef4444' },
    { name:'Medium', value: complaints.filter(c=>c.priority==='Medium').length, fill:'#f0a500' },
    { name:'Low',    value: complaints.filter(c=>c.priority==='Low').length,    fill:'#6b7280' },
  ]

  // Last 7 days trend
  const trendData = Array.from({ length:7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i)
    const label = format(day, 'dd MMM')
    const dayStr = format(day, 'yyyy-MM-dd')
    const count = complaints.filter(c => c.created_at && c.created_at.startsWith(dayStr)).length
    return { label, count }
  })

  const resolutionRate = complaints.length
    ? Math.round((complaints.filter(c=>c.status==='Resolved').length / complaints.length) * 100)
    : 0

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica','bold'); doc.setFontSize(16)
    doc.text('CampusFix — Analytics Report', 14, 18)
    doc.setFont('helvetica','normal'); doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(),'dd MMM yyyy, hh:mm a')}`, 14, 26)

    autoTable(doc, {
      startY: 32, head: [['Metric','Value']],
      body: [
        ['Total Complaints', complaints.length],
        ['Pending', complaints.filter(c=>c.status==='Pending').length],
        ['In Progress', complaints.filter(c=>c.status==='In Progress').length],
        ['Resolved', complaints.filter(c=>c.status==='Resolved').length],
        ['Resolution Rate', `${resolutionRate}%`],
        ['High Priority', complaints.filter(c=>c.priority==='High').length],
      ],
      headStyles: { fillColor:[240,165,0], textColor:[0,0,0] },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Category','Count']],
      body: catData.map(d => [d.name, d.value]),
      headStyles: { fillColor:[59,130,246], textColor:[255,255,255] },
    })

    doc.save(`analytics-report-${Date.now()}.pdf`)
    toast.success('Analytics PDF downloaded!')
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner"/></div>

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom:'1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div className="page-title">Analytics 📈</div>
          <div className="page-sub">Insights on campus complaints and resolution trends.</div>
        </div>
        <button className="btn btn-primary" onClick={exportPDF}>📄 Export PDF Report</button>
      </div>

      {/* KPI row */}
      <div className="stat-grid fade-up-1">
        <div className="stat-card stat-yellow"><div className="glow"/><div className="num">{complaints.length}</div><div className="lbl">Total Complaints</div></div>
        <div className="stat-card stat-green"> <div className="glow"/><div className="num">{resolutionRate}%</div><div className="lbl">Resolution Rate</div></div>
        <div className="stat-card stat-red">   <div className="glow"/><div className="num">{complaints.filter(c=>c.priority==='High').length}</div><div className="lbl">High Priority</div></div>
        <div className="stat-card stat-blue">  <div className="glow"/><div className="num">{complaints.filter(c=>!c.assigned_to).length}</div><div className="lbl">Unassigned</div></div>
      </div>

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }} className="fade-up-2">
        {/* Category bar chart */}
        <div className="card">
          <div style={{ fontSize:'13px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'1.25rem', fontWeight:600 }}>
            Complaints by Category
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'#6b7280' }} tickLine={false} axisLine={false}
                tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={{ fontSize:10, fill:'#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {catData.map((d,i) => <Cell key={i} fill={COLORS[d.name] || '#6b7280'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card">
          <div style={{ fontSize:'13px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'1.25rem', fontWeight:600 }}>
            Status Breakdown
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {statusData.map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:d.fill, flexShrink:0 }}/>
                  <span style={{ color:'var(--text-muted)' }}>{d.name}</span>
                  <strong style={{ color:'var(--text)', marginLeft:'auto', paddingLeft:8 }}>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1rem' }} className="fade-up-3">
        {/* 7-day trend */}
        <div className="card">
          <div style={{ fontSize:'13px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'1.25rem', fontWeight:600 }}>
            Complaints Filed — Last 7 Days
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top:0, right:10, bottom:0, left:-20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Complaints" stroke="#f0a500" strokeWidth={2.5} dot={{ fill:'#f0a500', r:4 }} activeDot={{ r:6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority breakdown */}
        <div className="card">
          <div style={{ fontSize:'13px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'1.25rem', fontWeight:600 }}>
            Priority Breakdown
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px', paddingTop:'0.5rem' }}>
            {priData.map(d => (
              <div key={d.name}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'5px' }}>
                  <span style={{ color:'var(--text-muted)' }}>{d.name}</span>
                  <strong>{d.value}</strong>
                </div>
                <div style={{ background:'var(--border)', borderRadius:4, height:8, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:4, background: d.fill,
                    width: complaints.length ? `${(d.value/complaints.length)*100}%` : '0%',
                    transition:'width 0.8s ease',
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Resolution ring */}
          <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
            <svg viewBox="0 0 80 80" width="100" height="100" style={{ display:'block', margin:'0 auto' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="7"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#22c55e" strokeWidth="7"
                strokeDasharray={`${(resolutionRate/100)*201} 201`}
                strokeLinecap="round" transform="rotate(-90 40 40)"/>
              <text x="40" y="36" textAnchor="middle" fill="#22c55e" fontSize="14" fontWeight="bold" fontFamily="Syne,sans-serif">{resolutionRate}%</text>
              <text x="40" y="50" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="DM Sans,sans-serif">resolved</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
