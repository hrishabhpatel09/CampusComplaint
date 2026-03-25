import { format } from 'date-fns'

const STATUS_STEPS = ['Pending', 'In Progress', 'Resolved']

function StatusStep({ label, done, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--surface2)',
        border: `2px solid ${done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0,
      }}>
        {done ? '✓' : active ? '●' : ''}
      </div>
      <span style={{ fontSize: '13px', color: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--text-muted)', fontWeight: done || active ? 500 : 400 }}>
        {label}
      </span>
    </div>
  )
}

export default function ComplaintModal({ complaint, onClose }) {
  if (!complaint) return null
  const currentStep = STATUS_STEPS.indexOf(complaint.status)

  const catClass = {
    'Hostel Maintenance': 'badge-hostel',
    'Classroom Equipment': 'badge-classroom',
    'Internet / WiFi': 'badge-internet',
    'Sanitation': 'badge-sanitation',
    'Other': 'badge-other',
  }[complaint.category] || 'badge-other'

  const statusClass = {
    'Pending': 'badge-pending',
    'In Progress': 'badge-progress',
    'Resolved': 'badge-resolved',
  }[complaint.status] || 'badge-pending'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div className="modal-title">Complaint #{complaint.id}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Filed {complaint.created_at ? format(new Date(complaint.created_at), 'dd MMM yyyy, hh:mm a') : '—'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span className={`badge ${catClass}`}>{complaint.category}</span>
          <span className={`badge ${statusClass}`}>{complaint.status}</span>
          <span className={`pri-${complaint.priority?.toLowerCase()}`} style={{ alignSelf: 'center' }}>
            ● {complaint.priority} Priority
          </span>
        </div>

        {/* Description */}
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: '14px', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          {complaint.description}
        </div>

        {complaint.location && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            📍 {complaint.location}
          </div>
        )}

        {/* Photo */}
        {complaint.photo_url && (
          <div style={{ marginBottom: '1.25rem' }}>
            <img src={`/uploads/${complaint.photo_url}`} alt="Complaint" style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxHeight: 200, objectFit: 'cover' }} />
          </div>
        )}

        <hr className="divider" />

        {/* Progress tracker */}
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>Progress Tracker</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
          {STATUS_STEPS.map((step, i) => (
            <StatusStep key={step} label={step} done={i < currentStep} active={i === currentStep} />
          ))}
        </div>

        {/* Timeline */}
        {complaint.timeline?.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px', marginBottom: '1rem' }}>Activity Log</div>
            <div className="timeline">
              {complaint.timeline.map((t, i) => (
                <div className="tl-item" key={i}>
                  <div className={`tl-dot ${i === 0 ? 'done' : i === complaint.timeline.length - 1 ? 'active' : ''}`} />
                  <div className="tl-time">{t.time}</div>
                  <div className="tl-text">{t.text}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Assigned to */}
        {complaint.assigned_name && (
          <div style={{ marginTop: '1rem', fontSize: '13px', color: 'var(--text-muted)' }}>
            🔧 Assigned to <strong style={{ color: 'var(--text)' }}>{complaint.assigned_name}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
