// Orders Admin API - Full CRUD for orders management
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Order status progression
const ORDER_STATUSES = ['new', 'confirmed', 'delivery_booked', 'in_transit', 'delivered']

// Get next status in progression
function getNextStatus(currentStatus) {
  const index = ORDER_STATUSES.indexOf(currentStatus)
  if (index === -1 || index === ORDER_STATUSES.length - 1) return null
  return ORDER_STATUSES[index + 1]
}

// Ensure orders table has all required columns
async function ensureTablesExist() {
  // Create/update orders table
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE,
      customer_id INTEGER REFERENCES customers(id),
      customer_email VARCHAR(255),
      customer_name VARCHAR(255),
      shipping_address JSONB,
      billing_address JSONB,
      total_amount NUMERIC(12,2) DEFAULT 0,
      subtotal NUMERIC(12,2) DEFAULT 0,
      tax_amount NUMERIC(12,2) DEFAULT 0,
      shipping_amount NUMERIC(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'new',
      delivery_status VARCHAR(50) DEFAULT 'new',
      payment_method VARCHAR(50),
      payment_status VARCHAR(50) DEFAULT 'pending',
      item_count INTEGER DEFAULT 0,
      notes TEXT,
      tracking_number VARCHAR(100),
      courier VARCHAR(100),
      expected_delivery_date DATE,
      shipped_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Add new columns if they don't exist
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
        ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_status') THEN
        ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(50) DEFAULT 'new';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'item_count') THEN
        ALTER TABLE orders ADD COLUMN item_count INTEGER DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal NUMERIC(12,2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
        ALTER TABLE orders ADD COLUMN tax_amount NUMERIC(12,2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_amount') THEN
        ALTER TABLE orders ADD COLUMN shipping_amount NUMERIC(12,2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_address') THEN
        ALTER TABLE orders ADD COLUMN billing_address JSONB;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_number') THEN
        ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'courier') THEN
        ALTER TABLE orders ADD COLUMN courier VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expected_delivery_date') THEN
        ALTER TABLE orders ADD COLUMN expected_delivery_date DATE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipped_at') THEN
        ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
      END IF;
    END $$;
  `

  // Create order_lines table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS order_lines (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      sku VARCHAR(100),
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price NUMERIC(12,2) DEFAULT 0,
      subtotal NUMERIC(12,2) DEFAULT 0,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Add sku and image_url if missing
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_lines' AND column_name = 'sku') THEN
        ALTER TABLE order_lines ADD COLUMN sku VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_lines' AND column_name = 'image_url') THEN
        ALTER TABLE order_lines ADD COLUMN image_url TEXT;
      END IF;
    END $$;
  `
}

// Generate unique order number
async function generateOrderNumber() {
  const date = new Date()
  const prefix = `AST-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

  // Get the latest order number with this prefix
  const result = await sql`
    SELECT order_number FROM orders
    WHERE order_number LIKE ${prefix + '%'}
    ORDER BY order_number DESC
    LIMIT 1
  `

  let sequence = 1
  if (result.length > 0) {
    const lastNum = result[0].order_number
    const lastSeq = parseInt(lastNum.split('-')[2]) || 0
    sequence = lastSeq + 1
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  try {
    await ensureTablesExist()

    const path = event.path.replace('/.netlify/functions/orders-admin', '')
    const segments = path.split('/').filter(Boolean)
    const method = event.httpMethod
    const params = new URLSearchParams(event.queryStringParameters || {})

    // GET /orders-admin - List all orders
    if (method === 'GET' && segments.length === 0) {
      const search = params.get('search')?.trim()
      const status = params.get('status')
      const limit = Math.min(parseInt(params.get('limit')) || 50, 200)
      const offset = parseInt(params.get('offset')) || 0

      let query = `
        SELECT o.*, c.display_name as customer_display_name, c.customer_type
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE 1=1
      `
      const values = []

      if (search) {
        values.push(`%${search}%`)
        query += ` AND (o.order_number ILIKE $${values.length} OR o.customer_name ILIKE $${values.length} OR o.customer_email ILIKE $${values.length})`
      }

      if (status && status !== 'all') {
        values.push(status)
        query += ` AND o.delivery_status = $${values.length}`
      }

      query += ` ORDER BY o.created_at DESC`
      values.push(limit)
      query += ` LIMIT $${values.length}`
      values.push(offset)
      query += ` OFFSET $${values.length}`

      const orders = await sql(query, values)

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM orders WHERE 1=1`
      const countValues = []
      if (search) {
        countValues.push(`%${search}%`)
        countQuery += ` AND (order_number ILIKE $${countValues.length} OR customer_name ILIKE $${countValues.length} OR customer_email ILIKE $${countValues.length})`
      }
      if (status && status !== 'all') {
        countValues.push(status)
        countQuery += ` AND delivery_status = $${countValues.length}`
      }

      const countResult = await sql(countQuery, countValues)
      const total = parseInt(countResult[0]?.total || 0)

      // Get status counts for filters
      const statusCounts = await sql`
        SELECT delivery_status, COUNT(*) as count
        FROM orders
        GROUP BY delivery_status
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orders,
          total,
          statusCounts: statusCounts.reduce((acc, s) => {
            acc[s.delivery_status || 'new'] = parseInt(s.count)
            return acc
          }, {}),
          hasMore: offset + orders.length < total
        })
      }
    }

    // GET /orders-admin/metrics - Get order metrics
    if (method === 'GET' && segments[0] === 'metrics') {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const metrics = await sql`
        SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order_value,
          COUNT(*) FILTER (WHERE delivery_status = 'new') as new_orders,
          COUNT(*) FILTER (WHERE delivery_status IN ('new', 'confirmed')) as pending_orders,
          COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered_orders,
          COUNT(*) FILTER (WHERE created_at >= ${startOfMonth.toISOString()}) as this_month_orders
        FROM orders
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, metrics: metrics[0] })
      }
    }

    // GET /orders-admin/:id - Get single order with line items
    if (method === 'GET' && segments.length === 1 && !isNaN(segments[0])) {
      const id = parseInt(segments[0])

      const orders = await sql`
        SELECT o.*, c.display_name as customer_display_name, c.customer_type,
               c.email as customer_contact_email, c.phone as customer_phone,
               c.billing_address_1, c.billing_city, c.billing_postcode
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ${id}
      `

      if (orders.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) }
      }

      const lineItems = await sql`
        SELECT * FROM order_lines WHERE order_id = ${id} ORDER BY id
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order: orders[0],
          lineItems,
          nextStatus: getNextStatus(orders[0].delivery_status)
        })
      }
    }

    // POST /orders-admin - Create order
    if (method === 'POST' && segments.length === 0) {
      const body = JSON.parse(event.body || '{}')
      const {
        customer_id, customer_email, customer_name,
        shipping_address, billing_address,
        subtotal, tax_amount, shipping_amount, total_amount,
        payment_method, notes, line_items = []
      } = body

      const order_number = await generateOrderNumber()
      const item_count = line_items.reduce((sum, item) => sum + (item.quantity || 1), 0)

      const result = await sql`
        INSERT INTO orders (
          order_number, customer_id, customer_email, customer_name,
          shipping_address, billing_address,
          subtotal, tax_amount, shipping_amount, total_amount,
          payment_method, item_count, notes, delivery_status, status
        ) VALUES (
          ${order_number}, ${customer_id || null}, ${customer_email || null}, ${customer_name || null},
          ${JSON.stringify(shipping_address) || null}, ${JSON.stringify(billing_address) || null},
          ${subtotal || 0}, ${tax_amount || 0}, ${shipping_amount || 0}, ${total_amount || 0},
          ${payment_method || null}, ${item_count}, ${notes || null}, 'new', 'new'
        )
        RETURNING *
      `

      const orderId = result[0].id

      // Insert line items
      for (const item of line_items) {
        await sql`
          INSERT INTO order_lines (order_id, product_id, sku, product_name, quantity, unit_price, subtotal, image_url)
          VALUES (${orderId}, ${item.product_id || null}, ${item.sku || null}, ${item.product_name},
                  ${item.quantity || 1}, ${item.unit_price || 0}, ${item.subtotal || 0}, ${item.image_url || null})
        `
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, order: result[0], order_number })
      }
    }

    // PUT /orders-admin/:id - Update order
    if (method === 'PUT' && segments.length === 1 && !isNaN(segments[0])) {
      const id = parseInt(segments[0])
      const body = JSON.parse(event.body || '{}')

      const updates = []
      const values = []

      const fields = [
        'customer_id', 'customer_email', 'customer_name',
        'shipping_address', 'billing_address',
        'subtotal', 'tax_amount', 'shipping_amount', 'total_amount',
        'payment_method', 'payment_status', 'delivery_status', 'status',
        'notes', 'tracking_number', 'courier', 'expected_delivery_date'
      ]

      for (const field of fields) {
        if (body[field] !== undefined) {
          const val = ['shipping_address', 'billing_address'].includes(field)
            ? JSON.stringify(body[field])
            : body[field]
          values.push(val)
          updates.push(`${field} = $${values.length}`)
        }
      }

      // Handle status-specific timestamps
      if (body.delivery_status === 'in_transit' && !body.shipped_at) {
        values.push(new Date().toISOString())
        updates.push(`shipped_at = $${values.length}`)
      }
      if (body.delivery_status === 'delivered' && !body.delivered_at) {
        values.push(new Date().toISOString())
        updates.push(`delivered_at = $${values.length}`)
      }

      if (updates.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) }
      }

      values.push(id)
      const query = `UPDATE orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`

      const result = await sql(query, values)

      if (result.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order: result[0],
          nextStatus: getNextStatus(result[0].delivery_status)
        })
      }
    }

    // POST /orders-admin/:id/progress - Progress order to next status
    if (method === 'POST' && segments.length === 2 && segments[1] === 'progress') {
      const id = parseInt(segments[0])

      // Get current order
      const orders = await sql`SELECT * FROM orders WHERE id = ${id}`
      if (orders.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) }
      }

      const currentStatus = orders[0].delivery_status || 'new'
      const nextStatus = getNextStatus(currentStatus)

      if (!nextStatus) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Order is already at final status' })
        }
      }

      // Update with timestamp
      let updateQuery = `UPDATE orders SET delivery_status = $1, status = $1, updated_at = CURRENT_TIMESTAMP`
      const updateValues = [nextStatus]

      if (nextStatus === 'in_transit') {
        updateQuery += `, shipped_at = CURRENT_TIMESTAMP`
      } else if (nextStatus === 'delivered') {
        updateQuery += `, delivered_at = CURRENT_TIMESTAMP`
      }

      updateValues.push(id)
      updateQuery += ` WHERE id = $${updateValues.length} RETURNING *`

      const result = await sql(updateQuery, updateValues)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order: result[0],
          previousStatus: currentStatus,
          newStatus: nextStatus,
          nextStatus: getNextStatus(nextStatus)
        })
      }
    }

    // POST /orders-admin/:id/book-delivery - Book delivery with tracking
    if (method === 'POST' && segments.length === 2 && segments[1] === 'book-delivery') {
      const id = parseInt(segments[0])
      const body = JSON.parse(event.body || '{}')
      const { courier, tracking_number, expected_delivery_date, notes } = body

      if (!courier || !tracking_number) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Courier and tracking number are required' })
        }
      }

      const result = await sql`
        UPDATE orders SET
          delivery_status = 'delivery_booked',
          status = 'delivery_booked',
          courier = ${courier},
          tracking_number = ${tracking_number},
          expected_delivery_date = ${expected_delivery_date || null},
          notes = COALESCE(notes || E'\n', '') || ${notes ? `Delivery booked: ${notes}` : 'Delivery booked'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `

      if (result.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          order: result[0],
          nextStatus: getNextStatus(result[0].delivery_status)
        })
      }
    }

    // POST /orders-admin/:id/duplicate - Duplicate an order
    if (method === 'POST' && segments.length === 2 && segments[1] === 'duplicate') {
      const id = parseInt(segments[0])

      // Get original order
      const orders = await sql`SELECT * FROM orders WHERE id = ${id}`
      if (orders.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) }
      }

      const original = orders[0]
      const newOrderNumber = await generateOrderNumber()

      // Create new order
      const result = await sql`
        INSERT INTO orders (
          order_number, customer_id, customer_email, customer_name,
          shipping_address, billing_address,
          subtotal, tax_amount, shipping_amount, total_amount,
          payment_method, item_count, notes, delivery_status, status
        ) VALUES (
          ${newOrderNumber}, ${original.customer_id}, ${original.customer_email}, ${original.customer_name},
          ${original.shipping_address}, ${original.billing_address},
          ${original.subtotal}, ${original.tax_amount}, ${original.shipping_amount}, ${original.total_amount},
          ${original.payment_method}, ${original.item_count}, ${'Duplicated from ' + original.order_number}, 'new', 'new'
        )
        RETURNING *
      `

      const newOrderId = result[0].id

      // Duplicate line items
      const lineItems = await sql`SELECT * FROM order_lines WHERE order_id = ${id}`
      for (const item of lineItems) {
        await sql`
          INSERT INTO order_lines (order_id, product_id, sku, product_name, quantity, unit_price, subtotal, image_url)
          VALUES (${newOrderId}, ${item.product_id}, ${item.sku}, ${item.product_name},
                  ${item.quantity}, ${item.unit_price}, ${item.subtotal}, ${item.image_url})
        `
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, order: result[0], order_number: newOrderNumber })
      }
    }

    // DELETE /orders-admin/:id - Delete order
    if (method === 'DELETE' && segments.length === 1 && !isNaN(segments[0])) {
      const id = parseInt(segments[0])

      // Delete line items first (cascade should handle this, but be explicit)
      await sql`DELETE FROM order_lines WHERE order_id = ${id}`
      await sql`DELETE FROM orders WHERE id = ${id}`

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (error) {
    console.error('Orders admin error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
