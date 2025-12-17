const API_BASE = '/.netlify/functions'

// Place order via checkout function
export const placeOrder = async (customerData, cart, totals) => {
  try {
    const response = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerData,
        cart,
        totals,
        paymentMethod: 'card'
      })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to place order')
    }

    // Return order with items and totals for confirmation page
    return {
      ...data.order,
      items: data.items,
      subtotal: data.totals.subtotal,
      tax: data.totals.tax,
      shipping: data.totals.shipping
    }
  } catch (error) {
    console.error('Error placing order:', error)
    throw error
  }
}

// Get order by ID (for customer order lookup)
export const getOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE}/orders-admin/${orderId}`)
    const data = await response.json()

    if (!data.success) {
      return null
    }

    return data.order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

// Get orders by email
export const getOrdersByEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE}/orders-admin?search=${encodeURIComponent(email)}`)
    const data = await response.json()

    if (!data.success) {
      return []
    }

    return data.orders
  } catch (error) {
    console.error('Error fetching orders by email:', error)
    throw error
  }
}
