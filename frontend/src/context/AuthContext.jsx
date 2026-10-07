import { useState, useEffect, useCallback } from 'react'
import { login as loginApi, register as registerApi, logout as logoutApi, getMe } from '../api/authApi'
import { AuthContext } from './authStore'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshUser = useCallback(async () => { const { data } = await getMe(); setUser(data.user); return data.user }, [])
  useEffect(() => { getMe().then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const login = async (voterId, password) => { const { data } = await loginApi({ voterId, password }); setUser(data.user); return data.user }
  const register = async form => (await registerApi(form)).data
  const logout = async () => { try { await logoutApi() } finally { setUser(null) } }
  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user, isAdmin: user?.role === 'admin', isVoter: user?.role === 'voter' }}>{children}</AuthContext.Provider>
}
