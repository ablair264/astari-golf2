const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

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

  const styleCode = styleNo !== null && styleNo !== undefined ? String(styleNo).trim() : ''
  if (styleCode) addExact('CAST(p.style_no AS TEXT)', styleCode)
  if (productType) addIlike('c.name', productType)
  if (hasSpecialOffer !== null && hasSpecialOffer !== undefined && hasSpecialOffer !== '') {
    addExact('p.is_special_offer', hasSpecialOffer === 'true')
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  return { where, values }
}

exports.handler = async function(event) {
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
      const rows = await sql(`
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
      `, values)
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
      const rows = await sql(`
          SELECT DISTINCT p.style_no,
            MIN(p.name) AS style_name,
            MAX(b.name) AS brand
          FROM products p
          LEFT JOIN brands b ON b.id = p.brand_id
          ${where}
          GROUP BY p.style_no
          ORDER BY p.style_no
          LIMIT ${limit}
        `, values)
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
      const rows = await sql(`
          SELECT DISTINCT p.sku, p.name, b.name AS brand
          FROM products p
          LEFT JOIN brands b ON b.id = p.brand_id
          ${where}
          ORDER BY p.sku
          LIMIT ${limit}
        `, values)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, skus: rows }) }
    }

    // Aggregated product types (categories)
    if (method === 'GET' && path === '/product-types') {
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
      const cursorRaw = params.get('cursor')
      const offset = cursorRaw && !Number.isNaN(Number(cursorRaw)) ? Number(cursorRaw) : 0
      const { where, values } = buildConditions(params)
      const rows = await sql(`
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
      `, values)
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
      const rows = await sql(`
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
        GROUP BY p.style_no, COALESCE(b.name, 'Unbranded'), COALESCE(c.name, 'Uncategorized')
        ORDER BY style_code ASC
        LIMIT ${limit + 1} OFFSET ${offset}
      `, values)
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

      const rows = await sql(`
        SELECT p.*, c.name AS category, b.name AS brand
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        ${whereClause}
        ${order}
        LIMIT ${limit + 1}
      `, values)
      const hasMore = rows.length > limit
      const data = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? data[data.length - 1].id : null
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, variants: data, nextCursor, hasMore }) }
    }

    // Get filter values for rule creation dropdowns
    if (method === 'GET' && path === '/filter-values') {
      const [brands, categories, styles] = await Promise.all([
        sql`SELECT id, name FROM brands ORDER BY name ASC`,
        sql`SELECT id, name FROM categories ORDER BY name ASC`,
        sql`SELECT DISTINCT style_no, MIN(name) as style_name FROM products WHERE style_no IS NOT NULL GROUP BY style_no ORDER BY style_no ASC LIMIT 500`
      ])
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, brands, categories, styles }) }
    }

    // Bulk apply margin to selected SKUs
    if (method === 'POST' && path === '/bulk/margin') {
      const body = JSON.parse(event.body || '{}')
      const { skuCodes, marginPercentage } = body

      if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'skuCodes array required' }) }
      }
      if (typeof marginPercentage !== 'number') {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'marginPercentage required' }) }
      }

      const margin = Number(marginPercentage)
      const placeholders = skuCodes.map((_, i) => `$${i + 1}`).join(', ')

      const result = await sql(`
          UPDATE products
          SET
            margin_percentage = ${margin},
            calculated_price = ROUND(price * (1 + ${margin}/100.0), 2),
            final_price = CASE
              WHEN is_special_offer AND offer_discount_percentage IS NOT NULL
                THEN ROUND(ROUND(price * (1 + ${margin}/100.0), 2) * (1 - offer_discount_percentage/100.0), 2)
              ELSE ROUND(price * (1 + ${margin}/100.0), 2)
            END,
            updated_at = NOW()
          WHERE sku IN (${placeholders})
          RETURNING sku
        `, skuCodes)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, updated: result.length, skus: result.map(r => r.sku) })
      }
    }

    // Bulk apply special offer to selected SKUs
    if (method === 'POST' && path === '/bulk/special-offer') {
      const body = JSON.parse(event.body || '{}')
      const { skuCodes, offerId, discountPercentage } = body

      if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'skuCodes array required' }) }
      }

      const discount = Number(discountPercentage) || 0
      const placeholders = skuCodes.map((_, i) => `$${i + 1}`).join(', ')

      const result = await sql(`
          UPDATE products
          SET
            is_special_offer = true,
            offer_discount_percentage = ${discount},
            offer_id = ${offerId || 'NULL'},
            final_price = ROUND(COALESCE(calculated_price, price) * (1 - ${discount}/100.0), 2),
            updated_at = NOW()
          WHERE sku IN (${placeholders})
          RETURNING sku
        `, skuCodes)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, updated: result.length, skus: result.map(r => r.sku) })
      }
    }

    // Bulk remove special offer from selected SKUs
    if (method === 'DELETE' && path === '/bulk/special-offer') {
      const body = JSON.parse(event.body || '{}')
      const { skuCodes } = body

      if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'skuCodes array required' }) }
      }

      const placeholders = skuCodes.map((_, i) => `$${i + 1}`).join(', ')

      const result = await sql(`
          UPDATE products
          SET
            is_special_offer = false,
            offer_discount_percentage = NULL,
            offer_id = NULL,
            final_price = COALESCE(calculated_price, price),
            updated_at = NOW()
          WHERE sku IN (${placeholders})
          RETURNING sku
        `, skuCodes)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, updated: result.length, skus: result.map(r => r.sku) })
      }
    }

    // Update all products by style_no (style-level editing)
    if (method === 'PUT' && /^\/style\/[A-Za-z0-9_-]+$/.test(path)) {
      const styleNo = path.replace('/style/', '')
      const body = JSON.parse(event.body || '{}')
      const { name, description, images, category_id } = body

      const updates = ['updated_at = NOW()']
      const values = []

      if (name !== undefined) {
        values.push(name)
        updates.push(`name = $${values.length}`)
      }
      if (description !== undefined) {
        values.push(description)
        updates.push(`description = $${values.length}`)
      }
      if (images !== undefined) {
        values.push(JSON.stringify(images))
        updates.push(`images = $${values.length}`)
      }
      if (category_id !== undefined) {
        values.push(category_id)
        updates.push(`category_id = $${values.length}`)
      }

      if (updates.length === 1) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'No fields to update' }) }
      }

      values.push(styleNo)
      const result = await sql(`UPDATE products SET ${updates.join(', ')} WHERE CAST(style_no AS TEXT) = $${values.length} RETURNING sku`, values)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, updated: result.length, styleNo })
      }
    }

    // Create new product
    if (method === 'POST' && (path === '' || path === '/')) {
      const data = JSON.parse(event.body || '{}')
      const {
        name, sku, style_no, brand_id, category_id, price,
        description, image_url, images, colour_name, colour_hex,
        stock_quantity, material, size, core_size,
        pack_quantity, is_multipack, parent_product_id,
        brand_name, category_name // Support name-based lookup
      } = data

      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'name is required' }) }
      }
      if (!sku) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'sku is required' }) }
      }

      const styleNoValue = style_no !== null && style_no !== undefined && String(style_no).trim() !== '' ? String(style_no).trim() : null

      // Generate slug from name + sku to ensure uniqueness across variants
      const baseSlug = slugify(name)
      const skuSlug = slugify(sku)
      const slug = skuSlug ? (baseSlug ? `${baseSlug}-${skuSlug}` : skuSlug) : baseSlug

      // Resolve brand_id from brand_name if provided
      let resolvedBrandId = brand_id || null
      if (!resolvedBrandId && brand_name) {
        // Look up or create brand
        const existingBrand = await sql`SELECT id FROM brands WHERE LOWER(name) = LOWER(${brand_name}) LIMIT 1`
        if (existingBrand.length > 0) {
          resolvedBrandId = existingBrand[0].id
        } else {
          // Create new brand
          const brandSlug = brand_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const newBrand = await sql`
            INSERT INTO brands (name, slug, created_at, updated_at)
            VALUES (${brand_name}, ${brandSlug}, NOW(), NOW())
            RETURNING id
          `
          resolvedBrandId = newBrand[0].id
        }
      }

      // Resolve category_id from category_name if provided
      let resolvedCategoryId = category_id || null
      if (!resolvedCategoryId && category_name) {
        // Look up or create category
        const existingCategory = await sql`SELECT id FROM categories WHERE LOWER(name) = LOWER(${category_name}) LIMIT 1`
        if (existingCategory.length > 0) {
          resolvedCategoryId = existingCategory[0].id
        } else {
          // Create new category
          const categorySlug = category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const newCategory = await sql`
            INSERT INTO categories (name, slug, created_at, updated_at)
            VALUES (${category_name}, ${categorySlug}, NOW(), NOW())
            RETURNING id
          `
          resolvedCategoryId = newCategory[0].id
        }
      }

      const result = await sql`
        INSERT INTO products (
          name, slug, sku, style_no, brand_id, category_id, price,
          description, image_url, images, colour_name, colour_hex,
          stock_quantity, material, size, core_size,
          pack_quantity, is_multipack, parent_product_id,
          is_active, created_at, updated_at
        ) VALUES (
          ${name},
          ${slug},
          ${sku},
          ${styleNoValue},
          ${resolvedBrandId},
          ${resolvedCategoryId},
          ${parseFloat(price) || 0},
          ${description || null},
          ${image_url || null},
          ${images ? JSON.stringify(images) : null},
          ${colour_name || null},
          ${colour_hex || null},
          ${parseInt(stock_quantity) || 0},
          ${material || null},
          ${size || null},
          ${core_size || null},
          ${pack_quantity ? parseInt(pack_quantity) : null},
          ${is_multipack || false},
          ${parent_product_id ? parseInt(parent_product_id) : null},
          true,
          NOW(),
          NOW()
        )
        RETURNING *
      `

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, product: result[0] })
      }
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

      const rows = await sql(`
        SELECT p.*, c.name AS category, b.name AS brand
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        ${whereClause}
        ${order}
        LIMIT ${limit + 1}
      `, values)
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
      const {
        marginPercentage, isSpecialOffer, offerDiscountPercentage,
        name, description, price, image_url, images, colour_name, colour_hex,
        stock_quantity, material, size, core_size,
        pack_quantity, is_multipack, parent_product_id, category_id
      } = data

      const updates = ['updated_at = NOW()']

      // Basic field updates
      if (name !== undefined) updates.push(`name = '${name.replace(/'/g, "''")}'`)
      if (description !== undefined) updates.push(`description = ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}`)
      if (price !== undefined) updates.push(`price = ${parseFloat(price) || 0}`)
      if (image_url !== undefined) updates.push(`image_url = ${image_url ? `'${image_url}'` : 'NULL'}`)
      if (images !== undefined) updates.push(`images = ${images ? `'${JSON.stringify(images)}'` : 'NULL'}`)
      if (colour_name !== undefined) updates.push(`colour_name = ${colour_name ? `'${colour_name.replace(/'/g, "''")}'` : 'NULL'}`)
      if (colour_hex !== undefined) updates.push(`colour_hex = ${colour_hex ? `'${colour_hex}'` : 'NULL'}`)
      if (stock_quantity !== undefined) updates.push(`stock_quantity = ${parseInt(stock_quantity) || 0}`)
      if (material !== undefined) updates.push(`material = ${material ? `'${material.replace(/'/g, "''")}'` : 'NULL'}`)
      if (size !== undefined) updates.push(`size = ${size ? `'${size.replace(/'/g, "''")}'` : 'NULL'}`)
      if (core_size !== undefined) updates.push(`core_size = ${core_size ? `'${core_size.replace(/'/g, "''")}'` : 'NULL'}`)
      if (pack_quantity !== undefined) updates.push(`pack_quantity = ${pack_quantity ? parseInt(pack_quantity) : 'NULL'}`)
      if (is_multipack !== undefined) updates.push(`is_multipack = ${is_multipack ? 'true' : 'false'}`)
      if (parent_product_id !== undefined) updates.push(`parent_product_id = ${parent_product_id ? parseInt(parent_product_id) : 'NULL'}`)
      if (category_id !== undefined) updates.push(`category_id = ${category_id ? parseInt(category_id) : 'NULL'}`)

      // Pricing/margin updates
      if (marginPercentage !== undefined) {
        updates.push(`margin_percentage = ${Number(marginPercentage)}`)
        updates.push(`calculated_price = ROUND(price * (1 + ${Number(marginPercentage)}/100.0), 2)`)
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
          THEN ROUND(COALESCE(${marginPercentage !== undefined ? `price * (1 + ${Number(marginPercentage)}/100.0)` : 'calculated_price'}, price) * (1 - ${offerDiscountPercentage !== undefined ? (offerDiscountPercentage === null ? '0' : Number(offerDiscountPercentage)) : 'offer_discount_percentage'}/100.0), 2)
          ELSE COALESCE(${marginPercentage !== undefined ? `ROUND(price * (1 + ${Number(marginPercentage)}/100.0), 2)` : 'calculated_price'}, price)
        END
      `
      updates.push(finalPrice)

      const res = await sql(`UPDATE products SET ${updates.join(', ')} WHERE sku = $1 RETURNING *`, [sku])
      if (res.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, product: res[0] }) }
    }

    // Bulk delete (deactivate) products by IDs
    if (method === 'DELETE' && path === '/bulk') {
      const body = JSON.parse(event.body || '{}')
      const { ids, permanent } = body
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Product IDs array required' }) }
      }

      // Limit to 100 at a time for safety
      const idsToDelete = ids
        .slice(0, 100)
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
      if (idsToDelete.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'No valid IDs provided' }) }
      }

      let result
      if (permanent) {
        // Hard delete - permanently remove from database
        result = await sql(`DELETE FROM products WHERE id = ANY($1::int[]) RETURNING id`, [idsToDelete])
      } else {
        // Soft delete - just deactivate
        result = await sql(`UPDATE products SET is_active = false, updated_at = NOW() WHERE id = ANY($1::int[]) RETURNING id`, [idsToDelete])
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          deletedCount: result.length,
          deletedIds: result.map(r => r.id)
        })
      }
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
