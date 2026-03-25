import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { complaintsAPI } from '../../api'

const CATEGORIES = ['Hostel Maintenance','Classroom Equipment','Internet / WiFi','Sanitation','Other']
const PRIORITIES  = ['High','Medium','Low']

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ category: '', location: '', description: '', priority: 'Medium' })
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.category)    return toast.error('Please select a category')
    if (!form.description) return toast.error('Please describe the issue')

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k, v))
      if (file) fd.append('photo', file)

      const { data } = await complaintsAPI.create(fd)
      toast.success(`Complaint #${data.id} submitted successfully!`)
      navigate('/student/my')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{ marginBottom: '1.75rem' }}>
        <div className="page-title">Submit a Complaint</div>
        <div className="page-sub">Report an issue and we'll get it resolved.</div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div className="card fade-up-1" style={{ marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px', marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Issue Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={set('category')} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" placeholder="e.g. Block C, Room 204, CS Lab" value={form.location} onChange={set('location')} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" placeholder="Describe the issue in detail. The more specific you are, the faster it can be resolved…" value={form.description} onChange={set('description')} required style={{ minHeight: 120 }} />
          </div>
        </div>

        {/* Photo upload */}
        <div className="card fade-up-2" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '14px', marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Attach Photo <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '12px' }}>(optional)</span>
          </div>

          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxHeight: 200, objectFit: 'cover' }} />
              <button type="button" onClick={() => { setFile(null); setPreview(null) }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>
                ✕
              </button>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>📎 {file?.name}</div>
            </div>
          ) : (
            <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'drag' : ''}`}>
              <input {...getInputProps()} />
              <div className="u-icon">📷</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>PNG, JPG, WEBP — max 5MB</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }} className="fade-up-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Submitting…</> : '🚀 Submit Complaint'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/student')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
