import { createContext, useContext, useState } from 'react'

const CustomerAuthContext = createContext(null)

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  // Simplified auth - no Firebase
  const signUp = async (email, password, additionalData = {}) => {
    // Mock signup
    const mockUser = { uid: Date.now().toString(), email }
    const profile = {
      id: mockUser.uid,
      email,
      ...additionalData,
      createdAt: new Date().toISOString(),
      orders: [],
      addresses: [],
      preferences: {}
    }
    setUser(mockUser)
    setCustomerProfile(profile)
    return mockUser
  }

  const signIn = async (email, password) => {
    // Mock login
    const mockUser = { uid: Date.now().toString(), email }
    setUser(mockUser)
    return mockUser
  }

  const signOutCustomer = () => {
    setUser(null)
    setCustomerProfile(null)
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in')
    setCustomerProfile((prev) => ({ ...prev, ...updates }))
  }

  const addAddress = async (address) => {
    if (!user) throw new Error('No user logged in')
    const addresses = customerProfile?.addresses || []
    const newAddresses = [...addresses, { ...address, id: Date.now().toString() }]
    setCustomerProfile((prev) => ({ ...prev, addresses: newAddresses }))
  }

  const updateAddress = async (addressId, updates) => {
    if (!user) throw new Error('No user logged in')
    const addresses = customerProfile?.addresses || []
    const updatedAddresses = addresses.map((addr) =>
      addr.id === addressId ? { ...addr, ...updates } : addr
    )
    setCustomerProfile((prev) => ({ ...prev, addresses: updatedAddresses }))
  }

  const deleteAddress = async (addressId) => {
    if (!user) throw new Error('No user logged in')
    const addresses = customerProfile?.addresses || []
    const updatedAddresses = addresses.filter((addr) => addr.id !== addressId)
    setCustomerProfile((prev) => ({ ...prev, addresses: updatedAddresses }))
  }

  const value = {
    user,
    customerProfile,
    loading,
    signUp,
    signIn,
    signOut: signOutCustomer,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    isAuthenticated: !!user
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  }
  return context
}
