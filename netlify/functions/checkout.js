const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

// Generate order number (format: AST-YYYYMM-XXXX)
async function generateOrderNumber() {
  const date = new Date()
  const prefix = `AST-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

  // Get the highest sequence for this month
  const result = await sql`
    SELECT order_number FROM orders
    WHERE order_number LIKE ${prefix + '-%'}
    ORDER BY order_number DESC
    LIMIT 1
  `

  let sequence = 1
  if (result.length > 0) {
    const lastNumber = result[0].order_number
    const lastSequence = parseInt(lastNumber.split('-')[2], 10)
    sequence = lastSequence + 1
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`
}

// Find or create customer
async function findOrCreateCustomer(customerData) {
  const { name, email, phone, address } = customerData

  // Try to find existing customer by email
  const existing = await sql`
    SELECT id FROM customers WHERE email = ${email} LIMIT 1
  `

  if (existing.length > 0) {
    // Update existing customer with new info
    await sql`
      UPDATE customers SET
        first_name = ${name.split(' ')[0] || ''},
        last_name = ${name.split(' ').slice(1).join(' ') || ''},
        phone = ${phone || null},
        shipping_address_1 = ${address?.line1 || null},
        shipping_address_2 = ${address?.line2 || null},
        shipping_city = ${address?.city || null},
        shipping_postcode = ${address?.postcode || null},
        shipping_country = ${address?.country || 'United Kingdom'},
        updated_at = NOW()
      WHERE id = ${existing[0].id}
    `
    return existing[0].id
  }

  // Create new customer
  const result = await sql`
    INSERT INTO customers (
      customer_type,
      first_name,
      last_name,
      email,
      phone,
      shipping_address_1,
      shipping_address_2,
      shipping_city,
      shipping_postcode,
      shipping_country,
      created_at,
      updated_at
    ) VALUES (
      'individual',
      ${name.split(' ')[0] || ''},
      ${name.split(' ').slice(1).join(' ') || ''},
      ${email},
      ${phone || null},
      ${address?.line1 || null},
      ${address?.line2 || null},
      ${address?.city || null},
      ${address?.postcode || null},
      ${address?.country || 'United Kingdom'},
      NOW(),
      NOW()
    )
    RETURNING id
  `

  return result[0].id
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { customerData, cart, totals, paymentMethod = 'card' } = body

    // Validate required data
    if (!customerData || !cart || cart.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing required checkout data' })
      }
    }

    // Find or create customer
    const customerId = await findOrCreateCustomer(customerData)

    // Generate order number
    const orderNumber = await generateOrderNumber()

    // Calculate totals from cart if not provided
    const subtotal = totals?.subtotal || cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = totals?.tax || subtotal * 0.20
    const shipping = totals?.shipping || (subtotal >= 50 ? 0 : 5)
    const totalAmount = totals?.total || (subtotal + tax + shipping)
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (
        order_number,
        customer_id,
        customer_email,
        customer_name,
        customer_phone,
        shipping_address,
        payment_method,
        payment_status,
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        item_count,
        delivery_status,
        created_at,
        updated_at
      ) VALUES (
        ${orderNumber},
        ${customerId},
        ${customerData.email},
        ${customerData.name},
        ${customerData.phone || null},
        ${JSON.stringify(customerData.address || {})},
        ${paymentMethod},
        'paid',
        ${subtotal},
        ${tax},
        ${shipping},
        ${totalAmount},
        ${itemCount},
        'new',
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const order = orderResult[0]

    // Create order line items
    for (const item of cart) {
      const unitPrice = parseFloat(item.price)
      const lineSubtotal = unitPrice * item.quantity

      await sql`
        INSERT INTO order_lines (
          order_id,
          product_id,
          product_name,
          product_sku,
          product_image,
          colour_name,
          quantity,
          unit_price,
          subtotal
        ) VALUES (
          ${order.id},
          ${item.id || null},
          ${item.name},
          ${item.sku || null},
          ${item.media || null},
          ${item.colour_name || null},
          ${item.quantity},
          ${unitPrice},
          ${lineSubtotal}
        )
      `
    }

    // Return success with order details
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_id: customerId,
          total_amount: order.total_amount,
          item_count: order.item_count,
          created_at: order.created_at
        },
        items: cart,
        totals: {
          subtotal,
          tax,
          shipping,
          total: totalAmount
        }
      })
    }

  } catch (error) {
    console.error('Checkout error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}
