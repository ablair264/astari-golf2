import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const mapSort = (column) => {
  const allowed = ['sku', 'name', 'brand', 'category', 'price', 'final_price', 'margin_percentage', 'created_at']
  return allowed.includes(column) ? column : 'sku'
}

const buildConditions = (params) => {
  const clauses = []
  const values = []

  const addExact = (column, value) => {
    values.push(value)
    clauses.push(`${column} = $${values.length}`)
  }
  const addIlike = (column, value) => {
    values.push(value)
    clauses.push(`${column} ILIKE $${values.length}`)
  }

  const search = params.get('search')?.trim()
  const categoryId = params.get('category_id')
  const brandId = params.get('brand_id')
  const styleNo = params.get('style_no') || params.get('styleCode')
  const brandName = params.get('brand')
  const productType = params.get('productType')
  const hasSpecialOffer = params.get('hasSpecialOffer')

  if (search) {
    const s = `%${search}%`
    const placeholders = ['p.name', 'p.sku', 'p.description', 'b.name', 'c.name', 'CAST(p.style_no AS TEXT)'].map((col) => {
      values.push(s)
      return `${col} ILIKE $${values.length}`
    })
    clauses.push(`(${placeholders.join(' OR ')})`)
  }

  const categoryIdNumber = Number(categoryId)
  if (!Number.isNaN(categoryIdNumber) && categoryId !== null && categoryId !== '') addExact('p.category_id', categoryIdNumber)

  const brandIdNumber = Number(brandId)
  if (!Number.isNaN(brandIdNumber) && brandId !== null && brandId !== '') {
    addExact('p.brand_id', brandIdNumber)
  }
  if (brandName) addIlike('b.name', brandName)

  const styleNumber = Number(styleNo)
  if (!Number.isNaN(styleNumber) && styleNo !== null && styleNo !== '') {
    addExact('p.style_no', styleNumber)
  }
  if (productType) addIlike('c.name', productType)
  if (hasSpecialOffer !== null && hasSpecialOffer !== undefined && hasSpecialOffer !== '') {
    addExact('p.is_special_offer', hasSpecialOffer === 'true')
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  return { where, values }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers }

  try {
    const url = new URL(event.rawUrl)
    const path = url.pathname.replace('/.netlify/functions/products-admin', '')
    const method = event.httpMethod
    const params = url.searchParams

    // Aggregated brands
    if (method === 'GET' && path === '/brands') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const offset = params.get('cursor') ? Number(params.get('cursor')) : 0
      const { where, values } = buildConditions(params)
      const rows = await sql({
        text: `
        SELECT
          COALESCE(b.name, 'Unbranded') AS brand,
          COUNT(DISTINCT p.style_no) AS style_count,
          COUNT(*) AS variant_count,
          AVG(p.margin_percentage) AS avg_margin,
          AVG(p.price) AS avg_cost,
          AVG(COALESCE(p.final_price, p.calculated_price, p.price)) AS avg_final_price,
          SUM(CASE WHEN p.is_special_offer THEN 1 ELSE 0 END) AS special_offer_count
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        ${where}
        GROUP BY COALESCE(b.name, 'Unbranded')
        ORDER BY brand ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      `,
        values,
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? offset + limit : null
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, brands: data, hasMore, nextCursor }) }
    }

    // Lists for selectors
    if (method === 'GET' && path === '/brands-list') {
      const rows = await sql`SELECT id, name, slug FROM brands ORDER BY name ASC`
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, brands: rows }) }
    }

    if (method === 'GET' && path === '/categories-list') {
      const rows = await sql`SELECT id, name, slug FROM categories ORDER BY name ASC`
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, categories: rows }) }
    }

    if (method === 'GET' && path === '/styles-list') {
      const limit = Math.min(parseInt(params.get('limit') || '200', 10), 500)
      const search = params.get('search')?.trim()
      const values = []
      let where = 'WHERE p.style_no IS NOT NULL'
      if (search) {
        values.push(`%${search}%`)
        where += ` AND (CAST(p.style_no AS TEXT) ILIKE $${values.length} OR p.name ILIKE $${values.length})`
      }
      const rows = await sql({
        text: `
          SELECT DISTINCT p.style_no,
            MIN(p.name) AS style_name,
            MAX(b.name) AS brand
          FROM products p
          LEFT JOIN brands b ON b.id = p.brand_id
          ${where}
          GROUP BY p.style_no
          ORDER BY p.style_no
          LIMIT ${limit}
        `,
        values,
      })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, styles: rows }) }
    }

    if (method === 'GET' && path === '/skus-list') {
      const limit = Math.min(parseInt(params.get('limit') || '500', 10), 1_000)
      const search = params.get('search')?.trim()
      const values = []
      let where = 'WHERE p.sku IS NOT NULL'
      if (search) {
        values.push(`%${search}%`)
        where += ` AND (p.sku ILIKE $${values.length} OR p.name ILIKE $${values.length})`
      }
      const rows = await sql({
        text: `
          SELECT DISTINCT p.sku, p.name, b.name AS brand
          FROM products p
          LEFT JOIN brands b ON b.id = p.brand_id
          ${where}
          ORDER BY p.sku
          LIMIT ${limit}
        `,
        values,
      })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, skus: rows }) }
    }

    // Aggregated product types (categories)
    if (method === 'GET' && path === '/product-types') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const cursorRaw = params.get('cursor')
      const offset = cursorRaw && !Number.isNaN(Number(cursorRaw)) ? Number(cursorRaw) : 0
      const { where, values } = buildConditions(params)
      const rows = await sql({
        text: `
        SELECT
          COALESCE(c.name, 'Uncategorized') AS product_type,
          COUNT(DISTINCT p.style_no) AS style_count,
          COUNT(*) AS variant_count,
          AVG(p.margin_percentage) AS avg_margin,
          AVG(p.price) AS avg_cost,
          AVG(COALESCE(p.final_price, p.calculated_price, p.price)) AS avg_final_price,
          SUM(CASE WHEN p.is_special_offer THEN 1 ELSE 0 END) AS special_offer_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        ${where}
        GROUP BY COALESCE(c.name, 'Uncategorized')
        ORDER BY product_type ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      `,
        values,
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? offset + limit : null
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, productTypes: data, hasMore, nextCursor }) }
    }

    // Aggregated styles (by style_no)
    if (method === 'GET' && path === '/styles') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const cursorRaw = params.get('cursor')
      const offset = cursorRaw && !Number.isNaN(Number(cursorRaw)) ? Number(cursorRaw) : 0
      const { where, values } = buildConditions(params)
      const rows = await sql({
        text: `
        SELECT
          p.style_no AS style_code,
          MIN(p.name) AS style_name,
          COALESCE(b.name, 'Unbranded') AS brand,
          COALESCE(c.name, 'Uncategorized') AS product_type,
          COUNT(*) AS variant_count,
          AVG(p.margin_percentage) AS avg_margin,
          MIN(p.price) AS min_cost,
          MAX(p.price) AS max_cost,
          MIN(COALESCE(p.final_price, p.calculated_price, p.price)) AS min_final_price,
          MAX(COALESCE(p.final_price, p.calculated_price, p.price)) AS max_final_price,
          SUM(CASE WHEN p.is_special_offer THEN 1 ELSE 0 END) AS special_offer_count,
          MAX(p.image_url) FILTER (WHERE p.image_url IS NOT NULL) AS image_url
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        ${where}
        GROUP BY p.style_no, brand, product_type
        ORDER BY style_code ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      `,
        values,
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? offset + limit : null
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, styles: data, hasMore, nextCursor }) }
    }

    // Variants (products list)
    if (method === 'GET' && path === '/variants') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const cursor = params.get('cursor')
      const sortBy = mapSort(params.get('sortBy') || 'sku')
      const sortDir = params.get('sortDir') === 'desc' ? 'DESC' : 'ASC'
      const { where, values } = buildConditions(params)
      const cursorId = Number(cursor)
      let whereClause = where
      if (!Number.isNaN(cursorId)) {
        values.push(cursorId)
        whereClause = whereClause ? `${whereClause} AND p.id > $${values.length}` : `WHERE p.id > $${values.length}`
      }
      const order = `ORDER BY ${sortBy} ${sortDir}`

      const rows = await sql({
        text: `
        SELECT p.*, c.name AS category, b.name AS brand
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        ${whereClause}
        ${order}
        LIMIT ${limit + 1}
      `,
        values,
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? data[data.length - 1].id : null
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, variants: data, nextCursor, hasMore }) }
    }

    // Default list
    if (method === 'GET' && (path === '' || path === '/')) {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const cursor = params.get('cursor')
      const sortBy = mapSort(params.get('sortBy') || 'sku')
      const sortDir = params.get('sortDir') === 'desc' ? 'DESC' : 'ASC'
      const { where, values } = buildConditions(params)
      const cursorId = Number(cursor)
      let whereClause = where
      if (!Number.isNaN(cursorId)) {
        values.push(cursorId)
        whereClause = whereClause ? `${whereClause} AND p.id > $${values.length}` : `WHERE p.id > $${values.length}`
      }
      const order = `ORDER BY ${sortBy} ${sortDir}`

      const rows = await sql({
        text: `
        SELECT p.*, c.name AS category, b.name AS brand
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        ${whereClause}
        ${order}
        LIMIT ${limit + 1}
      `,
        values,
      })
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? data[data.length - 1].id : null
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, products: data, nextCursor, hasMore, total: null }) }
    }

    // Raw brand list (id + name) for selectors
    if (method === 'GET' && path === '/brands-list') {
      const rows = await sql(`SELECT id, name, slug FROM brands ORDER BY name ASC`)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, brands: rows }) }
    }

    // GET single by sku
    if (method === 'GET' && /^\/[A-Za-z0-9_-]+$/.test(path)) {
      const sku = path.substring(1)
      const rows = await sql`
        SELECT p.*, c.name AS category, b.name AS brand
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.sku = ${sku}
      `
      if (rows.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, product: rows[0] }) }
    }

    // Update by sku
    if (method === 'PUT' && /^\/[A-Za-z0-9_-]+$/.test(path)) {
      const sku = path.substring(1)
      const data = JSON.parse(event.body || '{}')
      const { marginPercentage, isSpecialOffer, offerDiscountPercentage } = data

      const updates = ['updated_at = NOW()']
      if (marginPercentage !== undefined) {
        updates.push(`margin_percentage = ${Number(marginPercentage)}`)
        updates.push(`calculated_price = ROUND(price * (1 + ${Number(marginPercentage)}/100), 2)`)
      }
      if (isSpecialOffer !== undefined) {
        updates.push(`is_special_offer = ${isSpecialOffer ? 'true' : 'false'}`)
      }
      if (offerDiscountPercentage !== undefined) {
        updates.push(`offer_discount_percentage = ${offerDiscountPercentage === null ? 'NULL' : Number(offerDiscountPercentage)}`)
      }
      const finalPrice = `
        final_price = CASE
          WHEN ${isSpecialOffer !== undefined ? (isSpecialOffer ? 'true' : 'false') : 'is_special_offer'}
               AND ${offerDiscountPercentage !== undefined ? (offerDiscountPercentage === null ? 'NULL' : Number(offerDiscountPercentage)) : 'offer_discount_percentage'} IS NOT NULL
          THEN ROUND(COALESCE(${marginPercentage !== undefined ? `price * (1 + ${Number(marginPercentage)}/100)` : 'calculated_price'}, price) * (1 - ${offerDiscountPercentage !== undefined ? (offerDiscountPercentage === null ? '0' : Number(offerDiscountPercentage)) : 'offer_discount_percentage'}/100), 2)
          ELSE COALESCE(${marginPercentage !== undefined ? `ROUND(price * (1 + ${Number(marginPercentage)}/100), 2)` : 'calculated_price'}, price)
        END
      `
      updates.push(finalPrice)

      const res = await sql(`UPDATE products SET ${updates.join(', ')} WHERE sku = $1 RETURNING *`, [sku])
      if (res.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, product: res[0] }) }
    }

    // Soft delete (deactivate) by sku
    if (method === 'DELETE' && /^\/[A-Za-z0-9_-]+$/.test(path)) {
      const sku = path.substring(1)
      const res = await sql(`UPDATE products SET is_active = false, updated_at = NOW() WHERE sku = $1 RETURNING *`, [sku])
      if (res.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, product: res[0] }) }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
  } catch (error) {
    console.error('Products admin error', error)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal error', details: error.message }) }
  }
}
