const { open } = require('sqlite')
const sqlite3  = require('sqlite3')
const bcrypt   = require('bcryptjs')
const path     = require('path')

let _db = null

async function getDb() {
  if (_db) return _db
  _db = await open({
    filename: path.join(__dirname, 'campus.db'),
    driver: sqlite3.Database,
  })
  await _db.run('PRAGMA journal_mode = WAL')
  await _db.run('PRAGMA foreign_keys = ON')
  return _db
}

async function initDb() {
  const db = await getDb()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      category      TEXT    NOT NULL,
      description   TEXT    NOT NULL,
      location      TEXT,
      priority      TEXT    NOT NULL DEFAULT 'Medium',
      status        TEXT    NOT NULL DEFAULT 'Pending',
      photo_url     TEXT,
      assigned_to   INTEGER,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      title      TEXT    NOT NULL,
      message    TEXT    NOT NULL,
      read       INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaint_timeline (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      text         TEXT    NOT NULL,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // ── Seed demo users ──────────────────────────────────────
  const seedUser = async (name, email, plainPw, role) => {
    const exists = await db.get('SELECT id FROM users WHERE email = ?', email)
    if (exists) return exists.id
    const hash   = bcrypt.hashSync(plainPw, 10)
    const result = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      name, email, hash, role
    )
    return result.lastID
  }

  const studentId = await seedUser('Hrishabh Kumar', 'student@campus.edu', 'demo123', 'student')
  const staffId   = await seedUser('Rahul Mehta',    'staff@campus.edu',   'demo123', 'staff')
  const adminId   = await seedUser('Prof. Admin',    'admin@campus.edu',   'demo123', 'admin')

  const { count } = await db.get('SELECT COUNT(*) as count FROM complaints')
  if (count === 0) {
    const ins = (uid,cat,desc,loc,pri,stat,asgn) => db.run(
      'INSERT INTO complaints (user_id,category,description,location,priority,status,assigned_to) VALUES (?,?,?,?,?,?,?)',
      uid, cat, desc, loc, pri, stat, asgn
    )
    const tl = (cid, txt) => db.run('INSERT INTO complaint_timeline (complaint_id,text) VALUES (?,?)', cid, txt)
    const nt = (uid, t, m) => db.run('INSERT INTO notifications (user_id,title,message) VALUES (?,?,?)', uid, t, m)

    const c1 = await ins(studentId,'Internet / WiFi','WiFi not working in Room 204 for 2 days','Block C, Room 204','High','In Progress',staffId)
    await tl(c1.lastID, 'Complaint submitted by student')
    await tl(c1.lastID, 'Assigned to Rahul Mehta (IT Staff)')
    await tl(c1.lastID, 'Staff update: Router under inspection')

    const c2 = await ins(studentId,'Hostel Maintenance','Leaking tap in bathroom, water wasting','Block A, Room 102','Medium','Pending',null)
    await tl(c2.lastID, 'Complaint submitted by student')

    const c3 = await ins(studentId,'Classroom Equipment','Projector not working in CS Lab 3','CS Lab 3, Block B','Low','Resolved',staffId)
    await tl(c3.lastID, 'Complaint submitted')
    await tl(c3.lastID, 'Resolved: Projector bulb replaced')

    const c4 = await ins(studentId,'Sanitation','Dustbins overflowing near hostel entrance','Block B Ground Floor','Medium','Resolved',staffId)
    await tl(c4.lastID, 'Complaint submitted')
    await tl(c4.lastID, 'Resolved: Dustbins emptied and sanitised')

    await nt(studentId, 'Complaint Updated',  'Your complaint #1 status changed to "In Progress"')
    await nt(studentId, 'Complaint Resolved', 'Your complaint #3 has been resolved!')
    await nt(staffId,   'New Assignment',     'Complaint #1 has been assigned to you')
    await nt(adminId,   'New Complaint',      'A high-priority complaint was just filed')
  }

  console.log('✅ Database ready')
  return db
}

module.exports = { getDb, initDb }
