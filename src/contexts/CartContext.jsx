import { createContext, useContext, useEffect, useState } from 'react'
import * as cartService from '@/services/cart'
import * as orderService from '@/services/orders'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'astari_golf_cart'

// Cart utility functions
export const cartUtils = {
  // Calculate subtotal
  calculateSubtotal: (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  // Calculate tax (assuming 20% VAT for UK)
  calculateTax: (subtotal, taxRate = 0.20) => {
    return subtotal * taxRate
  },

  // Calculate shipping (free over £50, otherwise £5)
  calculateShipping: (subtotal, freeShippingThreshold = 50) => {
    return subtotal >= freeShippingThreshold ? 0 : 5
  },

  // Calculate total
  calculateTotal: (items) => {
    const subtotal = cartUtils.calculateSubtotal(items)
    const tax = cartUtils.calculateTax(subtotal)
    const shipping = cartUtils.calculateShipping(subtotal)
    return subtotal + tax + shipping
  },

  // Get total item count
  getTotalItems: (items) => {
    return items.reduce((total, item) => total + item.quantity, 0)
  },

  // Format price
  formatPrice: (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  // Load cart from Neon on mount (with localStorage fallback)
  useEffect(() => {
    const loadInitialCart = async () => {
      try {
        // Try to load from Neon first
        const neonCart = await cartService.loadCart()
        if (neonCart.length > 0) {
          setCart(neonCart)
          // Sync to localStorage
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(neonCart))
        } else {
          // Fallback to localStorage if Neon is empty
          const savedCart = localStorage.getItem(CART_STORAGE_KEY)
          if (savedCart) {
            setCart(JSON.parse(savedCart))
          }
        }
      } catch (error) {
        console.error('Error loading cart from Neon, using localStorage fallback:', error)
        // Fallback to localStorage on error
        try {
          const savedCart = localStorage.getItem(CART_STORAGE_KEY)
          if (savedCart) {
            setCart(JSON.parse(savedCart))
          }
        } catch (localError) {
          console.error('Error loading cart from localStorage:', localError)
        }
      } finally {
        setLoading(false)
      }
    }

    loadInitialCart()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [cart, loading])

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    // Optimistic update
    setCart((prevCart) => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex((item) => item.id === product.id)

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedCart = [...prevCart]
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        }
        return updatedCart
      } else {
        // Add new item - use final_price (with margin) if available
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: parseFloat(product.final_price ?? product.calculated_price ?? product.price ?? product.price_min ?? 0),
            final_price: product.final_price,
            calculated_price: product.calculated_price,
            brand: product.brand_name || product.brand,
            brand_logo: product.brand_logo,
            category: product.category_name || product.category,
            colour_name: product.colour_name,
            colour_hex: product.colour_hex,
            style_no: product.style_no,
            sku: product.sku,
            media: product.media || product.image_url || product.gallery?.[0] || product.images?.[0],
            quantity: quantity
          }
        ]
      }
    })

    // Persist to Neon (fire and forget with error handling)
    try {
      await cartService.upsertCartItem(product.id, quantity)
    } catch (error) {
      console.error('Failed to sync cart to Neon:', error)
      // Cart still works with localStorage fallback
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId) => {
    // Optimistic update
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))

    // Persist to Neon
    try {
      await cartService.removeCartItem(productId)
    } catch (error) {
      console.error('Failed to remove item from Neon cart:', error)
    }
  }

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    // Optimistic update
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
      return updatedCart
    })

    // Persist to Neon
    try {
      await cartService.updateCartItemQuantity(productId, quantity)
    } catch (error) {
      console.error('Failed to update quantity in Neon cart:', error)
    }
  }

  // Increment quantity
  const incrementQuantity = (productId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
      return updatedCart
    })
  }

  // Decrement quantity
  const decrementQuantity = (productId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity - 1
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
        }
        return item
      }).filter((item) => item.quantity > 0)
      return updatedCart
    })
  }

  // Clear entire cart
  const clearCart = async () => {
    // Optimistic update
    setCart([])

    // Persist to Neon
    try {
      await cartService.clearCart()
    } catch (error) {
      console.error('Failed to clear Neon cart:', error)
    }
  }

  // Place order
  const placeOrder = async (customerData) => {
    try {
      const order = await orderService.placeOrder(customerData)
      // Clear local cart after successful order
      setCart([])
      return order
    } catch (error) {
      console.error('Failed to place order:', error)
      throw error
    }
  }

  // Check if item is in cart
  const isInCart = (productId) => {
    return cart.some((item) => item.id === productId)
  }

  // Get item from cart
  const getCartItem = (productId) => {
    return cart.find((item) => item.id === productId)
  }

  // Calculate cart totals
  const subtotal = cartUtils.calculateSubtotal(cart)
  const tax = cartUtils.calculateTax(subtotal)
  const shipping = cartUtils.calculateShipping(subtotal)
  const total = subtotal + tax + shipping
  const itemCount = cartUtils.getTotalItems(cart)

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    isInCart,
    getCartItem,
    placeOrder,
    // Calculated values
    subtotal,
    tax,
    shipping,
    total,
    itemCount
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
