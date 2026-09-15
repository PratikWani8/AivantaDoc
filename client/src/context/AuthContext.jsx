import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/authApi'
import axiosInstance from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('aivanta-token'))
  const [loading, setLoading] = useState(true)

  // On mount: validate stored token by fetching profile
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
      authApi.getProfile()
        .then(res => setUser(res.data?.data || res.data))
        .catch(() => { clearSession() })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  const saveSession = (tokenValue, userData) => {
    localStorage.setItem('aivanta-token', tokenValue)
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`
    setToken(tokenValue)
    setUser(userData)
  }

  const clearSession = () => {
    localStorage.removeItem('aivanta-token')
    delete axiosInstance.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    const { token: tok, user: userData } = res.data?.data || res.data
    saveSession(tok, userData)
    return userData
  }

  const register = async (payload) => {
    const res = await authApi.register(payload)
    const { token: tok, user: userData } = res.data?.data || res.data
    saveSession(tok, userData)
    return userData
  }

  const logout = async () => {
    try { await authApi.logout() } catch (_) {}
    clearSession()
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
