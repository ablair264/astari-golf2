import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Ensure customers table exists
async function ensureTablesExist() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      customer_type VARCHAR(20) DEFAULT 'individual',
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      display_name VARCHAR(255) NOT NULL,
      trading_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      logo_url TEXT,

      billing_address_1 VARCHAR(255),
      billing_address_2 VARCHAR(255),
      billing_city VARCHAR(100),
      billing_county VARCHAR(100),
      billing_postcode VARCHAR(20),
      billing_country VARCHAR(100) DEFAULT 'United Kingdom',

      shipping_address_1 VARCHAR(255),
      shipping_address_2 VARCHAR(255),
      shipping_city VARCHAR(100),
      shipping_county VARCHAR(100),
      shipping_postcode VARCHAR(20),
      shipping_country VARCHAR(100) DEFAULT 'United Kingdom',

      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      location_region VARCHAR(50),

      total_spent DECIMAL(12,2) DEFAULT 0,
      total_paid DECIMAL(12,2) DEFAULT 0,
      average_order_value DECIMAL(12,2) DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      outstanding_amount DECIMAL(12,2) DEFAULT 0,

      payment_terms INTEGER DEFAULT 30,
      currency_code VARCHAR(3) DEFAULT 'GBP',
      segment VARCHAR(50),
      notes TEXT,

      first_order_date TIMESTAMP,
      last_order_date TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Add new columns for individual customers if table already exists
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
        ALTER TABLE customers ADD COLUMN customer_type VARCHAR(20) DEFAULT 'individual';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'first_name') THEN
        ALTER TABLE customers ADD COLUMN first_name VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_name') THEN
        ALTER TABLE customers ADD COLUMN last_name VARCHAR(100);
      END IF;
    END $$;
  `

  await sql`
    CREATE TABLE IF NOT EXISTS customer_contacts (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      role VARCHAR(100),
      is_primary BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

// UK region mapping from postcode
function mapPostcodeToRegion(postcode) {
  if (!postcode) return null
  const area = postcode.toUpperCase().trim().substring(0, 2)

  // Scotland
  if (['AB', 'DD', 'DG', 'EH', 'FK', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'].some(p => area.startsWith(p))) {
    return 'Scotland'
  }
  // North East
  if (['DH', 'DL', 'NE', 'SR', 'TS'].some(p => area.startsWith(p))) {
    return 'North East'
  }
  // North West
  if (['BB', 'BL', 'CA', 'CH', 'CW', 'FY', 'LA', 'OL', 'PR', 'SK', 'WA', 'WN'].some(p => area.startsWith(p)) || area === 'L' || area === 'M') {
    return 'North West'
  }
  // Wales
  if (['CF', 'LD', 'LL', 'NP', 'SA', 'SY'].some(p => area.startsWith(p))) {
    return 'Wales'
  }
  // Midlands
  if (['CV', 'DE', 'DN', 'HR', 'LE', 'LN', 'NG', 'NN', 'PE', 'ST', 'TF', 'WR', 'WS', 'WV'].some(p => area.startsWith(p)) || area === 'B' || area === 'S') {
    return 'Midlands'
  }
  // London
  if (['BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'NW', 'RM', 'SE', 'SM', 'SW', 'TW', 'UB', 'WC', 'WD'].some(p => area.startsWith(p)) || ['E', 'N', 'W'].includes(area[0])) {
    return 'London'
  }
  // South West
  if (['BA', 'BS', 'DT', 'EX', 'GL', 'PL', 'SN', 'SP', 'TA', 'TQ', 'TR'].some(p => area.startsWith(p))) {
    return 'South West'
  }
  // South East (default for most remaining)
  if (['AL', 'BN', 'CB', 'CM', 'CO', 'CT', 'GU', 'HP', 'IP', 'LU', 'ME', 'MK', 'NR', 'OX', 'PO', 'RG', 'RH', 'SG', 'SL', 'SO', 'SS', 'TN'].some(p => area.startsWith(p))) {
    return 'South East'
  }
  // Ireland
  if (area === 'BT') {
    return 'Ireland'
  }

  return 'South East' // Default
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  try {
    await ensureTablesExist()

    const path = event.path.replace('/.netlify/functions/customers-admin', '')
    const segments = path.split('/').filter(Boolean)
    const method = event.httpMethod
    const params = new URLSearchParams(event.queryStringParameters || {})

    // GET /customers-admin - List all customers
    if (method === 'GET' && segments.length === 0) {
      const search = params.get('search')?.trim()
      const sortBy = params.get('sortBy') || 'display_name'
      const sortDir = params.get('sortDir') === 'desc' ? 'DESC' : 'ASC'
      const limit = Math.min(parseInt(params.get('limit')) || 50, 200)
      const offset = parseInt(params.get('offset')) || 0
      const region = params.get('region')

      let query = `
        SELECT * FROM customers
        WHERE is_active = true
      `
      const values = []

      if (search) {
        values.push(`%${search}%`)
        query += ` AND (display_name ILIKE $${values.length} OR trading_name ILIKE $${values.length} OR email ILIKE $${values.length})`
      }

      if (region) {
        values.push(region)
        query += ` AND location_region = $${values.length}`
      }

      // Validate sort column
      const allowedSort = ['display_name', 'trading_name', 'total_spent', 'order_count', 'last_order_date', 'created_at']
      const safeSort = allowedSort.includes(sortBy) ? sortBy : 'display_name'

      query += ` ORDER BY ${safeSort} ${sortDir} NULLS LAST`
      values.push(limit)
      query += ` LIMIT $${values.length}`
      values.push(offset)
      query += ` OFFSET $${values.length}`

      const customers = await sql(query, values)

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM customers WHERE is_active = true`
      const countValues = []
      if (search) {
        countValues.push(`%${search}%`)
        countQuery += ` AND (display_name ILIKE $${countValues.length} OR trading_name ILIKE $${countValues.length} OR email ILIKE $${countValues.length})`
      }
      if (region) {
        countValues.push(region)
        countQuery += ` AND location_region = $${countValues.length}`
      }

      const countResult = await sql(countQuery, countValues)
      const total = parseInt(countResult[0]?.total || 0)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customers,
          total,
          hasMore: offset + customers.length < total
        })
      }
    }

    // GET /customers-admin/regions - Get region stats for map
    if (method === 'GET' && segments[0] === 'regions') {
      const regions = await sql`
        SELECT
          location_region as region,
          COUNT(*) as customer_count,
          COALESCE(SUM(total_spent), 0) as total_revenue
        FROM customers
        WHERE is_active = true AND location_region IS NOT NULL
        GROUP BY location_region
        ORDER BY customer_count DESC
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ regions })
      }
    }

    // GET /customers-admin/map - Get customers with coordinates for map
    if (method === 'GET' && segments[0] === 'map') {
      const region = params.get('region')

      let customers
      if (region) {
        customers = await sql`
          SELECT
            id, display_name, email, billing_postcode, billing_county,
            latitude, longitude, location_region,
            total_spent, order_count, last_order_date
          FROM customers
          WHERE is_active = true
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
            AND location_region = ${region}
        `
      } else {
        customers = await sql`
          SELECT
            id, display_name, email, billing_postcode, billing_county,
            latitude, longitude, location_region,
            total_spent, order_count, last_order_date
          FROM customers
          WHERE is_active = true
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        `
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ customers })
      }
    }

    // GET /customers-admin/:id - Get single customer
    if (method === 'GET' && segments.length === 1 && !isNaN(segments[0])) {
      const id = parseInt(segments[0])

      const customers = await sql`SELECT * FROM customers WHERE id = ${id}`
      if (customers.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Customer not found' }) }
      }

      const contacts = await sql`SELECT * FROM customer_contacts WHERE customer_id = ${id} ORDER BY is_primary DESC`

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ customer: customers[0], contacts })
      }
    }

    // POST /customers-admin - Create customer
    if (method === 'POST' && segments.length === 0) {
      const body = JSON.parse(event.body || '{}')
      const {
        customer_type = 'individual', first_name, last_name,
        display_name: providedDisplayName, trading_name, email, phone, logo_url,
        billing_address_1, billing_address_2, billing_city, billing_county, billing_postcode, billing_country,
        shipping_address_1, shipping_address_2, shipping_city, shipping_county, shipping_postcode, shipping_country,
        latitude, longitude, payment_terms, currency_code, segment, notes
      } = body

      // Compute display_name: for individuals, combine first/last name; for business, use provided
      let display_name = providedDisplayName
      if (customer_type === 'individual') {
        if (first_name || last_name) {
          display_name = [first_name, last_name].filter(Boolean).join(' ')
        }
      }

      if (!display_name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name is required (first_name/last_name for individuals, display_name for business)' }) }
      }

      // Auto-determine region from postcode
      const location_region = mapPostcodeToRegion(billing_postcode)

      const result = await sql`
        INSERT INTO customers (
          customer_type, first_name, last_name, display_name, trading_name, email, phone, logo_url,
          billing_address_1, billing_address_2, billing_city, billing_county, billing_postcode, billing_country,
          shipping_address_1, shipping_address_2, shipping_city, shipping_county, shipping_postcode, shipping_country,
          latitude, longitude, location_region, payment_terms, currency_code, segment, notes
        ) VALUES (
          ${customer_type}, ${first_name || null}, ${last_name || null}, ${display_name}, ${trading_name || null}, ${email || null}, ${phone || null}, ${logo_url || null},
          ${billing_address_1 || null}, ${billing_address_2 || null}, ${billing_city || null}, ${billing_county || null}, ${billing_postcode || null}, ${billing_country || 'United Kingdom'},
          ${shipping_address_1 || null}, ${shipping_address_2 || null}, ${shipping_city || null}, ${shipping_county || null}, ${shipping_postcode || null}, ${shipping_country || 'United Kingdom'},
          ${latitude || null}, ${longitude || null}, ${location_region}, ${payment_terms || 30}, ${currency_code || 'GBP'}, ${segment || null}, ${notes || null}
        )
        RETURNING *
      `

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ customer: result[0] })
      }
    }

    // PUT /customers-admin/:id - Update customer
    if (method === 'PUT' && segments.length === 1 && !isNaN(segments[0])) {
      const id = parseInt(segments[0])
      const body = JSON.parse(event.body || '{}')

      // Build dynamic update
      const updates = []
      const values = []

      const fields = [
        'customer_type', 'first_name', 'last_name', 'display_name', 'trading_name', 'email', 'phone', 'logo_url',
        'billing_address_1', 'billing_address_2', 'billing_city', 'billing_county', 'billing_postcode', 'billing_country',
        'shipping_address_1', 'shipping_address_2', 'shipping_city', 'shipping_county', 'shipping_postcode', 'shipping_country',
        'latitude', 'longitude', 'payment_terms', 'currency_code', 'segment', 'notes', 'is_active'
      ]

      for (const field of fields) {
        if (body[field] !== undefined) {
          values.push(body[field])
          updates.push(`${field} = $${values.length}`)
        }
      }

      // Auto-compute display_name for individuals when first/last name changes
      const customerType = body.customer_type
      if (customerType === 'individual' && (body.first_name !== undefined || body.last_name !== undefined)) {
        // Fetch current values if not provided
        const existing = await sql`SELECT first_name, last_name FROM customers WHERE id = ${id}`
        if (existing.length > 0) {
          const firstName = body.first_name !== undefined ? body.first_name : existing[0].first_name
          const lastName = body.last_name !== undefined ? body.last_name : existing[0].last_name
          const computedDisplayName = [firstName, lastName].filter(Boolean).join(' ')
          if (computedDisplayName && !body.display_name) {
            values.push(computedDisplayName)
            updates.push(`display_name = $${values.length}`)
          }
        }
      }

      // Auto-update region if postcode changed
      if (body.billing_postcode) {
        const region = mapPostcodeToRegion(body.billing_postcode)
        values.push(region)
        updates.push(`location_region = $${values.length}`)
      }

      if (updates.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) }
      }

      values.push(id)
      const query = `UPDATE customers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`

      const result = await sql(query, values)

      if (result.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Customer not found' }) }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ customer: result[0] })
      }
    }

    // DELETE /customers-admin/:id - Soft delete customer
    if (method === 'DELETE' && segments.length === 1 && !isNaN(segments[0])) {
      const id = parseInt(segments[0])

      await sql`UPDATE customers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    }

    // POST /customers-admin/:id/contacts - Add contact to customer
    if (method === 'POST' && segments.length === 2 && segments[1] === 'contacts') {
      const customerId = parseInt(segments[0])
      const body = JSON.parse(event.body || '{}')
      const { name, email, phone, role, is_primary, notes } = body

      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'name is required' }) }
      }

      // If this is primary, unset other primaries
      if (is_primary) {
        await sql`UPDATE customer_contacts SET is_primary = false WHERE customer_id = ${customerId}`
      }

      const result = await sql`
        INSERT INTO customer_contacts (customer_id, name, email, phone, role, is_primary, notes)
        VALUES (${customerId}, ${name}, ${email || null}, ${phone || null}, ${role || null}, ${is_primary || false}, ${notes || null})
        RETURNING *
      `

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ contact: result[0] })
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (error) {
    console.error('Customers admin error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
