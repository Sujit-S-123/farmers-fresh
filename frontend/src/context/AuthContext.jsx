import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, ask the backend who is logged in (session cookie)
  useEffect(() => {
    api.get('auth', 'me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const d = await api.post('auth', 'login', { email, password })
    setUser(d.user)
    return d.user
  }

  const register = async (form) => {
    const d = await api.post('auth', 'register', form)
    setUser(d.user)
    return d.user
  }

  const logout = async () => {
    await api.post('auth', 'logout').catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Where each role lands after logging in
export const homeFor = (user) =>
  !user ? '/' : user.role === 'admin' ? '/admin' : user.role === 'farmer' ? '/farmer' : '/shop'
