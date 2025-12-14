import { query } from '@/lib/neonClient'
import { getSessionId } from './cart'

// Generate order number (format: ORD-YYYYMMDD-XXXXX)
const generateOrderNumber = () => {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `ORD-${dateStr}-${random}`
}

// Place order from cart
export const placeOrder = async (customerData) => {
  try {
    const sessionId = getSessionId()

    // Get cart items with product details
    const cartItems = await query(`
      SELECT
        ci.product_id,
        ci.quantity,
        p.name,
        p.price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = $1
    `, [sessionId])

    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) =>
      sum + (parseFloat(item.price) * item.quantity), 0
    )
    const tax = subtotal * 0.20 // 20% VAT
    const shipping = subtotal >= 50 ? 0 : 5
    const totalAmount = subtotal + tax + shipping

    // Create order
    const orderNumber = generateOrderNumber()
    const orderResult = await query(`
      INSERT INTO orders (
        order_number,
        customer_email,
        customer_name,
        shipping_address,
        total_amount,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      orderNumber,
      customerData.email,
      customerData.name || '',
      JSON.stringify(customerData.address || {}),
      totalAmount,
      'pending'
    ])

    const order = orderResult[0]

    // Create order lines
    for (const item of cartItems) {
      const unitPrice = parseFloat(item.price)
      const subtotal = unitPrice * item.quantity

      await query(`
        INSERT INTO order_lines (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        order.id,
        item.product_id,
        item.name,
        item.quantity,
        unitPrice,
        subtotal
      ])
    }

    // Clear cart after successful order
    await query(`
      DELETE FROM cart_items WHERE session_id = $1
    `, [sessionId])

    return {
      ...order,
      items: cartItems,
      subtotal,
      tax,
      shipping
    }
  } catch (error) {
    console.error('Error placing order:', error)
    throw error
  }
}

// Get order by ID
export const getOrder = async (orderId) => {
  try {
    const orderResult = await query(`
      SELECT * FROM orders WHERE id = $1
    `, [orderId])

    if (orderResult.length === 0) {
      return null
    }

    const order = orderResult[0]

    // Get order lines
    const lines = await query(`
      SELECT * FROM order_lines WHERE order_id = $1
    `, [orderId])

    return {
      ...order,
      lines
    }
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

// Get orders by email
export const getOrdersByEmail = async (email) => {
  try {
    const orders = await query(`
      SELECT * FROM orders
      WHERE customer_email = $1
      ORDER BY created_at DESC
    `, [email])

    return orders
  } catch (error) {
    console.error('Error fetching orders by email:', error)
    throw error
  }
}

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const result = await query(`
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, orderId])

    return result[0]
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}
