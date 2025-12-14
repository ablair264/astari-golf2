import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, signInCredentials, signOut } from '@/services/auth'

const AdminAuthContext = createContext(null)

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getSession()
        setUser(session?.user || null)
      } catch (err) {
        console.error('Session load error', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [])

  const login = async (email, password) => {
    const res = await signInCredentials(email, password)
    // Fetch session after login
    const session = await getSession()
    setUser(session?.user || null)
    return res
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
