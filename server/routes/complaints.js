const router    = require('express').Router()
const multer    = require('multer')
const path      = require('path')
const fs        = require('fs')
const { getDb } = require('../db')
const auth      = require('../middleware/auth')
const role      = require('../middleware/role')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    cb(null, `complaint_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

const notify = async (db, userId, title, message) => {
  try { await db.run('INSERT INTO notifications (user_id,title,message) VALUES (?,?,?)', userId, title, message) }
  catch { /* silent */ }
}
const addTimeline = async (db, complaintId, text) => {
  await db.run('INSERT INTO complaint_timeline (complaint_id,text) VALUES (?,?)', complaintId, text)
}

// GET /api/complaints
router.get('/', auth, async (req, res) => {
  try {
    const db = await getDb()
    const { id, role: userRole } = req.user
    let rows
    if (userRole === 'admin') {
      rows = await db.all(`
        SELECT c.*, u.name AS student_name, s.name AS assigned_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users s ON c.assigned_to = s.id
        ORDER BY c.created_at DESC`)
    } else if (userRole === 'staff') {
      rows = await db.all(`
        SELECT c.*, u.name AS student_name, s.name AS assigned_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users s ON c.assigned_to = s.id
        WHERE c.assigned_to = ?
        ORDER BY c.created_at DESC`, id)
    } else {
      rows = await db.all(`
        SELECT c.*, s.name AS assigned_name
        FROM complaints c
        LEFT JOIN users s ON c.assigned_to = s.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC`, id)
    }
    res.json(rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/complaints/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const db = await getDb()
    const rows = await db.all(`
      SELECT c.*, s.name AS assigned_name
      FROM complaints c
      LEFT JOIN users s ON c.assigned_to = s.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC`, req.user.id)
    res.json(rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/complaints/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const db = await getDb()
    const complaint = await db.get(`
      SELECT c.*, u.name AS student_name, s.name AS assigned_name
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users s ON c.assigned_to = s.id
      WHERE c.id = ?`, req.params.id)
    if (!complaint) return res.status(404).json({ message: 'Not found' })
    const timeline = await db.all(
      'SELECT text, created_at AS time FROM complaint_timeline WHERE complaint_id = ? ORDER BY id ASC',
      req.params.id)
    res.json({ ...complaint, timeline })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/complaints
router.post('/', auth, role('student'), upload.single('photo'), async (req, res) => {
  const { category, description, location, priority } = req.body
  if (!category || !description) return res.status(400).json({ message: 'Category and description are required' })
  try {
    const db     = await getDb()
    const result = await db.run(
      'INSERT INTO complaints (user_id,category,description,location,priority,photo_url) VALUES (?,?,?,?,?,?)',
      req.user.id, category, description, location || null,
      priority || 'Medium', req.file ? req.file.filename : null)
    await addTimeline(db, result.lastID, `Complaint submitted by ${req.user.name}`)
    const admins = await db.all("SELECT id FROM users WHERE role='admin'")
    for (const a of admins)
      await notify(db, a.id, 'New Complaint Filed', `${req.user.name} filed a ${priority||'Medium'} priority complaint.`)
    res.status(201).json({ id: result.lastID, message: 'Complaint submitted successfully' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/complaints/:id
router.patch('/:id', auth, role('staff','admin'), async (req, res) => {
  const { status } = req.body
  try {
    const db        = await getDb()
    const complaint = await db.get('SELECT * FROM complaints WHERE id = ?', req.params.id)
    if (!complaint) return res.status(404).json({ message: 'Not found' })
    await db.run('UPDATE complaints SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', status, req.params.id)
    await addTimeline(db, req.params.id, `Status changed to "${status}" by ${req.user.name}`)
    await notify(db, complaint.user_id, 'Complaint Status Updated', `Your complaint #${req.params.id} is now "${status}".`)
    res.json({ message: 'Updated successfully' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/complaints/:id/assign
router.patch('/:id/assign', auth, role('admin'), async (req, res) => {
  const { assigned_to, status } = req.body
  try {
    const db        = await getDb()
    const complaint = await db.get('SELECT * FROM complaints WHERE id = ?', req.params.id)
    if (!complaint) return res.status(404).json({ message: 'Not found' })
    const newStatus = status || 'In Progress'
    await db.run('UPDATE complaints SET assigned_to=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      assigned_to, newStatus, req.params.id)
    const staff = await db.get('SELECT name FROM users WHERE id = ?', assigned_to)
    const staffName = staff?.name || 'a staff member'
    await addTimeline(db, req.params.id, `Assigned to ${staffName} by Admin`)
    await notify(db, complaint.user_id, 'Complaint Assigned', `Your complaint #${req.params.id} was assigned to ${staffName}.`)
    await notify(db, assigned_to, 'New Task Assigned', `Complaint #${req.params.id} has been assigned to you.`)
    res.json({ message: 'Assigned successfully' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/complaints/:id
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM complaint_timeline WHERE complaint_id = ?', req.params.id)
    await db.run('DELETE FROM complaints WHERE id = ?', req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
