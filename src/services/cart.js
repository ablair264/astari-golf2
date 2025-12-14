import { query } from '@/lib/neonClient'

// Get or create session ID
export const getSessionId = () => {
  const SESSION_KEY = 'astari_session_id'
  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    // Generate UUID v4
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

// Load cart items from Neon
export const loadCart = async () => {
  try {
    const sessionId = getSessionId()
    const items = await query(`
      SELECT
        ci.id as cart_item_id,
        ci.quantity,
        p.id,
        p.name,
        p.price,
        p.image_url as media,
        c.name as category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.session_id = $1
      ORDER BY ci.created_at DESC
    `, [sessionId])

    return items.map(item => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      media: item.media,
      category: item.category,
      quantity: item.quantity,
      cart_item_id: item.cart_item_id
    }))
  } catch (error) {
    console.error('Error loading cart from Neon:', error)
    // Fallback to empty cart if Neon fails
    return []
  }
}

// Add or update cart item
export const upsertCartItem = async (productId, quantity) => {
  try {
    const sessionId = getSessionId()

    const result = await query(`
      INSERT INTO cart_items (session_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id, product_id)
      DO UPDATE SET
        quantity = cart_items.quantity + $3,
        updated_at = NOW()
      RETURNING *
    `, [sessionId, productId, quantity])

    return result[0]
  } catch (error) {
    console.error('Error upserting cart item:', error)
    throw error
  }
}

// Update cart item quantity (absolute set)
export const updateCartItemQuantity = async (productId, quantity) => {
  try {
    const sessionId = getSessionId()

    if (quantity <= 0) {
      return await removeCartItem(productId)
    }

    const result = await query(`
      UPDATE cart_items
      SET quantity = $1, updated_at = NOW()
      WHERE session_id = $2 AND product_id = $3
      RETURNING *
    `, [quantity, sessionId, productId])

    return result[0]
  } catch (error) {
    console.error('Error updating cart item:', error)
    throw error
  }
}

// Remove cart item
export const removeCartItem = async (productId) => {
  try {
    const sessionId = getSessionId()

    await query(`
      DELETE FROM cart_items
      WHERE session_id = $1 AND product_id = $2
    `, [sessionId, productId])
  } catch (error) {
    console.error('Error removing cart item:', error)
    throw error
  }
}

// Clear entire cart for session
export const clearCart = async () => {
  try {
    const sessionId = getSessionId()

    await query(`
      DELETE FROM cart_items
      WHERE session_id = $1
    `, [sessionId])
  } catch (error) {
    console.error('Error clearing cart:', error)
    throw error
  }
}
