import { createContext, useContext, useEffect, useState } from 'react'

const WishlistContext = createContext(null)

const WISHLIST_STORAGE_KEY = 'astari_golf_wishlist'

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist))
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error)
      }
    }
  }, [wishlist, loading])

  // Add item to wishlist
  const addToWishlist = (product) => {
    setWishlist((prevWishlist) => {
      // Check if item already exists
      const exists = prevWishlist.some((item) => item.id === product.id)
      if (exists) {
        return prevWishlist
      }

      return [
        ...prevWishlist,
        {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          brand: product.brand,
          category: product.category,
          media: product.media || product.gallery?.[0],
          description: product.description,
          addedAt: new Date().toISOString()
        }
      ]
    })
  }

  // Remove item from wishlist
  const removeFromWishlist = (productId) => {
    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => item.id !== productId)
    )
  }

  // Toggle item in wishlist (add if not present, remove if present)
  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item.id === product.id)
    if (exists) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId)
  }

  // Get wishlist item
  const getWishlistItem = (productId) => {
    return wishlist.find((item) => item.id === productId)
  }

  // Clear entire wishlist
  const clearWishlist = () => {
    setWishlist([])
  }

  // Get wishlist count
  const wishlistCount = wishlist.length

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistItem,
    clearWishlist,
    wishlistCount
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return context
}
