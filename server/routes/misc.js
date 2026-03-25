const router    = require('express').Router()
const { getDb } = require('../db')
const auth      = require('../middleware/auth')
const role      = require('../middleware/role')

router.get('/notifications', auth, async (req, res) => {
  try {
    const db   = await getDb()
    const rows = await db.all(
      'SELECT id, title, message, read, created_at AS time FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30',
      req.user.id)
    res.json(rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/notifications/:id/read', auth, async (req, res) => {
  try {
    const db = await getDb()
    await db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', req.params.id, req.user.id)
    res.json({ message: 'Marked as read' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/notifications/read-all', auth, async (req, res) => {
  try {
    const db = await getDb()
    await db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', req.user.id)
    res.json({ message: 'All marked as read' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/users/staff', auth, role('admin'), async (req, res) => {
  try {
    const db   = await getDb()
    const rows = await db.all("SELECT id, name, email FROM users WHERE role = 'staff'")
    res.json(rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/analytics/summary', auth, role('admin'), async (req, res) => {
  try {
    const db = await getDb()
    const total      = (await db.get('SELECT COUNT(*) AS c FROM complaints')).c
    const pending    = (await db.get("SELECT COUNT(*) AS c FROM complaints WHERE status='Pending'")).c
    const inProgress = (await db.get("SELECT COUNT(*) AS c FROM complaints WHERE status='In Progress'")).c
    const resolved   = (await db.get("SELECT COUNT(*) AS c FROM complaints WHERE status='Resolved'")).c
    const unassigned = (await db.get('SELECT COUNT(*) AS c FROM complaints WHERE assigned_to IS NULL')).c
    const byCategory = await db.all('SELECT category AS name, COUNT(*) AS value FROM complaints GROUP BY category')
    res.json({ total, pending, inProgress, resolved, unassigned, byCategory })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
