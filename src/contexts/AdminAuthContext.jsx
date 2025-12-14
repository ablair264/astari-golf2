import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // Simplified auth - no Firebase
  const login = async (email, password) => {
    // Mock login for now
    setUser({ email })
    return { email }
  }

  const logout = () => {
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
