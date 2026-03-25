import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import StudentLayout      from './pages/student/StudentLayout'
import StudentDashboard   from './pages/student/StudentDashboard'
import SubmitComplaint    from './pages/student/SubmitComplaint'
import MyComplaints       from './pages/student/MyComplaints'
import StaffLayout        from './pages/staff/StaffLayout'
import StaffDashboard     from './pages/staff/StaffDashboard'
import StaffResolved      from './pages/staff/StaffResolved'
import AdminLayout        from './pages/admin/AdminLayout'
import AdminDashboard     from './pages/admin/AdminDashboard'
import AllComplaints      from './pages/admin/AllComplaints'
import Analytics          from './pages/admin/Analytics'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="spinner"/></div>
  if (!user)   return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'student') return <Navigate to="/student" replace />
  if (user.role === 'staff')   return <Navigate to="/staff"   replace />
  if (user.role === 'admin')   return <Navigate to="/admin"   replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1e2330', color: '#f0f2f7', border: '1px solid #2a2f3d', fontFamily: "'DM Sans', sans-serif" },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0d0f14' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0d0f14' } },
          }}
        />
        <Routes>
          <Route path="/"         element={<RoleRedirect />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route index          element={<StudentDashboard />} />
            <Route path="submit"  element={<SubmitComplaint />} />
            <Route path="my"      element={<MyComplaints />} />
          </Route>

          {/* Staff */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>}>
            <Route index           element={<StaffDashboard />} />
            <Route path="resolved" element={<StaffResolved />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index              element={<AdminDashboard />} />
            <Route path="complaints"  element={<AllComplaints />} />
            <Route path="analytics"   element={<Analytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
