require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const path       = require('path')
const { initDb } = require('./db')

const app = express()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth',       require('./routes/auth'))
app.use('/api/complaints', require('./routes/complaints'))
app.use('/api',            require('./routes/misc'))

app.use((req, res) => res.status(404).json({ message: 'Route not found' }))
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 5000

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CampusFix server running on http://localhost:${PORT}`)
    console.log(`\nDemo logins:`)
    console.log(`  Student → student@campus.edu / demo123`)
    console.log(`  Staff   → staff@campus.edu   / demo123`)
    console.log(`  Admin   → admin@campus.edu   / demo123\n`)
  })
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
