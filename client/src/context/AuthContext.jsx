import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('campusfix_user')
    const token  = localStorage.getItem('campusfix_token')
    if (stored && token) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('campusfix_user',  JSON.stringify(userData))
    localStorage.setItem('campusfix_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('campusfix_user')
    localStorage.removeItem('campusfix_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
