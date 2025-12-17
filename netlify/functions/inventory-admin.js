const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Ensure stock_history table exists
const ensureStockHistoryTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS stock_history (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      sku TEXT,
      previous_quantity INTEGER,
      new_quantity INTEGER,
      change_amount INTEGER,
      change_type TEXT,
      reason TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// Ensure reorder_point column exists
const ensureReorderPointColumn = async () => {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10`
  } catch (e) {
    // Column might already exist
  }
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers }

  try {
    const url = new URL(event.rawUrl)
    const path = url.pathname.replace('/.netlify/functions/inventory-admin', '')
    const method = event.httpMethod
    const params = url.searchParams

    // Ensure required schema exists
    await ensureStockHistoryTable()
    await ensureReorderPointColumn()

    // GET /inventory-admin/stats - Dashboard statistics
    if (method === 'GET' && path === '/stats') {
      const [stats] = await sql`
        SELECT
          COUNT(*) AS total_skus,
          SUM(CASE WHEN stock_quantity > COALESCE(reorder_point, 10) THEN 1 ELSE 0 END) AS in_stock,
          SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= COALESCE(reorder_point, 10) THEN 1 ELSE 0 END) AS low_stock,
          SUM(CASE WHEN stock_quantity = 0 OR stock_quantity IS NULL THEN 1 ELSE 0 END) AS out_of_stock,
          SUM(COALESCE(stock_quantity, 0)) AS total_units,
          AVG(COALESCE(stock_quantity, 0))::numeric(10,2) AS avg_stock_per_sku
        FROM products
        WHERE is_active = true
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          stats: {
            totalSkus: parseInt(stats.total_skus) || 0,
            inStock: parseInt(stats.in_stock) || 0,
            lowStock: parseInt(stats.low_stock) || 0,
            outOfStock: parseInt(stats.out_of_stock) || 0,
            totalUnits: parseInt(stats.total_units) || 0,
            avgStockPerSku: parseFloat(stats.avg_stock_per_sku) || 0,
          }
        })
      }
    }

    // GET /inventory-admin/alerts - Products below reorder point
    if (method === 'GET' && path === '/alerts') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const offset = parseInt(params.get('offset') || '0', 10)

      const rows = await sql`
        SELECT
          p.id, p.sku, p.name, p.image_url,
          p.stock_quantity, COALESCE(p.reorder_point, 10) AS reorder_point,
          b.name AS brand_name, c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = true
          AND COALESCE(p.stock_quantity, 0) <= COALESCE(p.reorder_point, 10)
        ORDER BY p.stock_quantity ASC, p.name ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      `

      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          alerts: data,
          hasMore,
          nextOffset: hasMore ? offset + limit : null
        })
      }
    }

    // GET /inventory-admin/history - Stock change history
    if (method === 'GET' && path === '/history') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const offset = parseInt(params.get('offset') || '0', 10)
      const productId = params.get('product_id')
      const sku = params.get('sku')

      let whereClause = ''
      const values = []

      if (productId) {
        values.push(parseInt(productId))
        whereClause = `WHERE sh.product_id = $${values.length}`
      } else if (sku) {
        values.push(sku)
        whereClause = `WHERE sh.sku = $${values.length}`
      }

      const rows = await sql(`
        SELECT
          sh.*, p.name AS product_name, p.image_url
        FROM stock_history sh
        LEFT JOIN products p ON p.id = sh.product_id
        ${whereClause}
        ORDER BY sh.created_at DESC
        LIMIT ${limit + 1} OFFSET ${offset}
      `, values)

      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          history: data,
          hasMore,
          nextOffset: hasMore ? offset + limit : null
        })
      }
    }

    // GET /inventory-admin - List products with stock info
    if (method === 'GET' && (path === '' || path === '/')) {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const offset = parseInt(params.get('offset') || '0', 10)
      const search = params.get('search')?.trim()
      const status = params.get('status') // 'in_stock', 'low_stock', 'out_of_stock'
      const brandId = params.get('brand_id')
      const categoryId = params.get('category_id')
      const sortBy = params.get('sortBy') || 'stock_quantity'
      const sortDir = params.get('sortDir') === 'desc' ? 'DESC' : 'ASC'

      const clauses = ['p.is_active = true']
      const values = []

      if (search) {
        values.push(`%${search}%`)
        clauses.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length} OR b.name ILIKE $${values.length})`)
      }

      if (status === 'in_stock') {
        clauses.push('p.stock_quantity > COALESCE(p.reorder_point, 10)')
      } else if (status === 'low_stock') {
        clauses.push('p.stock_quantity > 0 AND p.stock_quantity <= COALESCE(p.reorder_point, 10)')
      } else if (status === 'out_of_stock') {
        clauses.push('(p.stock_quantity = 0 OR p.stock_quantity IS NULL)')
      }

      if (brandId) {
        values.push(parseInt(brandId))
        clauses.push(`p.brand_id = $${values.length}`)
      }

      if (categoryId) {
        values.push(parseInt(categoryId))
        clauses.push(`p.category_id = $${values.length}`)
      }

      const where = `WHERE ${clauses.join(' AND ')}`

      // Validate sortBy column
      const allowedSortColumns = ['stock_quantity', 'sku', 'name', 'reorder_point', 'created_at']
      const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'stock_quantity'

      const rows = await sql(`
        SELECT
          p.id, p.sku, p.name, p.image_url,
          COALESCE(p.stock_quantity, 0) AS stock_quantity,
          COALESCE(p.reorder_point, 10) AS reorder_point,
          p.price, COALESCE(p.final_price, p.calculated_price, p.price) AS final_price,
          b.name AS brand_name, c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        ${where}
        ORDER BY ${safeSortBy} ${sortDir}, p.sku ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      `, values)

      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          products: data,
          hasMore,
          nextOffset: hasMore ? offset + limit : null
        })
      }
    }

    // POST /inventory-admin/adjust - Bulk adjust stock
    if (method === 'POST' && path === '/adjust') {
      const body = JSON.parse(event.body || '{}')
      const { productIds, adjustmentType, quantity, reason, createdBy } = body

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'productIds array required' }) }
      }

      if (!adjustmentType || !['set', 'add', 'subtract'].includes(adjustmentType)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'adjustmentType must be set, add, or subtract' }) }
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'quantity must be a non-negative number' }) }
      }

      const results = []
      const errors = []

      for (const productId of productIds.slice(0, 100)) {
        try {
          // Get current stock
          const [current] = await sql`
            SELECT id, sku, stock_quantity FROM products WHERE id = ${productId}
          `

          if (!current) {
            errors.push({ productId, error: 'Product not found' })
            continue
          }

          const previousQuantity = current.stock_quantity || 0
          let newQuantity

          if (adjustmentType === 'set') {
            newQuantity = quantity
          } else if (adjustmentType === 'add') {
            newQuantity = previousQuantity + quantity
          } else {
            newQuantity = Math.max(0, previousQuantity - quantity)
          }

          const changeAmount = newQuantity - previousQuantity

          // Update stock
          await sql`
            UPDATE products
            SET stock_quantity = ${newQuantity}, updated_at = NOW()
            WHERE id = ${productId}
          `

          // Record history
          await sql`
            INSERT INTO stock_history (product_id, sku, previous_quantity, new_quantity, change_amount, change_type, reason, created_by)
            VALUES (${productId}, ${current.sku}, ${previousQuantity}, ${newQuantity}, ${changeAmount}, ${adjustmentType}, ${reason || null}, ${createdBy || 'admin'})
          `

          results.push({
            productId,
            sku: current.sku,
            previousQuantity,
            newQuantity,
            changeAmount
          })
        } catch (err) {
          errors.push({ productId, error: err.message })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          adjusted: results.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        })
      }
    }

    // PUT /inventory-admin/reorder-point - Bulk set reorder points
    if (method === 'PUT' && path === '/reorder-point') {
      const body = JSON.parse(event.body || '{}')
      const { productIds, reorderPoint } = body

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'productIds array required' }) }
      }

      if (typeof reorderPoint !== 'number' || reorderPoint < 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'reorderPoint must be a non-negative number' }) }
      }

      const result = await sql`
        UPDATE products
        SET reorder_point = ${reorderPoint}, updated_at = NOW()
        WHERE id = ANY(${productIds}::int[])
        RETURNING id, sku
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          updated: result.length,
          products: result
        })
      }
    }

    // GET /inventory-admin/export - Export inventory data
    if (method === 'GET' && path === '/export') {
      const rows = await sql`
        SELECT
          p.sku, p.name,
          b.name AS brand, c.name AS category,
          COALESCE(p.stock_quantity, 0) AS stock_quantity,
          COALESCE(p.reorder_point, 10) AS reorder_point,
          p.price, COALESCE(p.final_price, p.calculated_price, p.price) AS final_price
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = true
        ORDER BY p.sku ASC
      `

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="inventory-export.csv"'
        },
        body: [
          ['SKU', 'Name', 'Brand', 'Category', 'Stock', 'Reorder Point', 'Cost', 'Price'].join(','),
          ...rows.map(r => [
            r.sku,
            `"${(r.name || '').replace(/"/g, '""')}"`,
            r.brand || '',
            r.category || '',
            r.stock_quantity,
            r.reorder_point,
            r.price,
            r.final_price
          ].join(','))
        ].join('\n')
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
  } catch (error) {
    console.error('Inventory admin error', error)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal error', details: error.message }) }
  }
}
