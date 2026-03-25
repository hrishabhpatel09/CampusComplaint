const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { getDb } = require('../db')

const sign = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
)

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' })
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
  const validRoles = ['student','staff','admin']
  const userRole = validRoles.includes(role) ? role : 'student'
  try {
    const db = await getDb()
    const exists = await db.get('SELECT id FROM users WHERE email = ?', email)
    if (exists) return res.status(409).json({ message: 'Email already registered' })
    const hash   = bcrypt.hashSync(password, 10)
    const result = await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', name, email, hash, userRole)
    const user   = await db.get('SELECT id,name,email,role FROM users WHERE id = ?', result.lastID)
    res.status(201).json({ user, token: sign(user) })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
  try {
    const db   = await getDb()
    const user = await db.get('SELECT * FROM users WHERE email = ?', email)
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'Invalid email or password' })
    const { password: _, ...safeUser } = user
    res.json({ user: safeUser, token: sign(safeUser) })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

module.exports = router
