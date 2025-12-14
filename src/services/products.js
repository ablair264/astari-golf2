import { query } from '@/lib/neonClient'

// Get all products with optional filters
export const getAllProducts = async (filters = {}) => {
  try {
    let sql = `
      SELECT 
        p.*, 
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo, b.metadata as brand_metadata
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = true
    `
    const params = []
    let paramIndex = 1

    // Category filter
    if (filters.category) {
      sql += ` AND c.slug = $${paramIndex}`
      params.push(filters.category)
      paramIndex++
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      sql += ` AND p.price >= $${paramIndex}`
      params.push(filters.minPrice)
      paramIndex++
    }
    if (filters.maxPrice !== undefined) {
      sql += ` AND p.price <= $${paramIndex}`
      params.push(filters.maxPrice)
      paramIndex++
    }

    // Search filter
    if (filters.search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    sql += ' ORDER BY p.created_at DESC'

    const products = await query(sql, params)
    return applyBrandMargins(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

// Get products by brand (kept for backward compatibility)
export const getProductsByBrand = async (brand) => {
  // Note: Current schema doesn't have brand field, using metadata instead
  try {
    const products = await query(`
      SELECT 
        p.*, 
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo, b.metadata as brand_metadata
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `)
    // Filter by brand in metadata if needed
    return applyBrandMargins(products).filter(p => (
      p.brand_name?.toLowerCase() === brand?.toLowerCase() ||
      p.brand?.toLowerCase() === brand?.toLowerCase() ||
      brand === 'ASTARI'
    ))
  } catch (error) {
    console.error('Error fetching products by brand:', error)
    throw error
  }
}

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const products = await query(`
      SELECT 
        p.*, 
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo, b.metadata as brand_metadata
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = true AND c.slug = $1
      ORDER BY p.created_at DESC
    `, [category])
    return applyBrandMargins(products)
  } catch (error) {
    console.error('Error fetching products by category:', error)
    throw error
  }
}

// Get single product by ID
export const getProduct = async (id) => {
  try {
    const products = await query(`
      SELECT 
        p.*, 
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo, b.metadata as brand_metadata
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = $1
    `, [id])
    const withMargin = applyBrandMargins(products)
    return withMargin[0] || null
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

// Get single product by slug
export const getProductBySlug = async (slug) => {
  try {
    const products = await query(`
      SELECT 
        p.*, 
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo, b.metadata as brand_metadata
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = $1
    `, [slug])
    const withMargin = applyBrandMargins(products)
    return withMargin[0] || null
  } catch (error) {
    console.error('Error fetching product by slug:', error)
    throw error
  }
}

// Get all categories
export const getCategories = async () => {
  try {
    const categories = await query(`
      SELECT * FROM categories ORDER BY name
    `)
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

// Get price range for filters
export const getPriceRange = async () => {
  try {
    const result = await query(`
      SELECT
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM products
      WHERE is_active = true
    `)
    return result[0] || { min_price: 0, max_price: 1000 }
  } catch (error) {
    console.error('Error fetching price range:', error)
    throw error
  }
}

// Create product
export const createProduct = async (productData) => {
  try {
    const result = await query(`
      INSERT INTO products (
        name, slug, description, price, category_id,
        image_url, images, stock_quantity, metadata,
        sku, style_no, colour_name, colour_hex, brand_id, brand
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      productData.name,
      productData.slug,
      productData.description,
      productData.price,
      productData.category_id,
      productData.image_url || '',
      JSON.stringify(productData.images || []),
      productData.stock_quantity || 0,
      JSON.stringify(productData.metadata || {}),
      productData.sku || null,
      productData.style_no || null,
      productData.colour_name || null,
      productData.colour_hex || null,
      productData.brand_id || null,
      productData.brand || null,
    ])
    return result[0]
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const result = await query(`
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        category_id = $4,
        image_url = $5,
        images = $6,
        stock_quantity = $7,
        metadata = $8,
        is_active = $9
      WHERE id = $10
      RETURNING *
    `, [
      productData.name,
      productData.description,
      productData.price,
      productData.category_id,
      productData.image_url,
      JSON.stringify(productData.images || []),
      productData.stock_quantity,
      JSON.stringify(productData.metadata || {}),
      productData.is_active !== undefined ? productData.is_active : true,
      id,
    ])
    return result[0]
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Delete product
export const deleteProduct = async (id) => {
  try {
    await query(`DELETE FROM products WHERE id = $1`, [id])
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}


const applyBrandMargins = (products) => {
  return products.map(p => {
    const rules = p.brand_metadata?.margin_rules || []
    const margin = rules[0]?.value
    if (margin !== undefined && margin !== null) {
      const factor = 1 + Number(margin) / 100
      const basePrice = parseFloat(p.price)
      const price_min = p.price_min !== undefined ? p.price_min : basePrice
      const price_max = p.price_max !== undefined ? p.price_max : basePrice
      return {
        ...p,
        price_with_margin: parseFloat((basePrice * factor).toFixed(2)),
        price_min: parseFloat((price_min * factor).toFixed(2)),
        price_max: parseFloat((price_max * factor).toFixed(2)),
        margin_applied: margin,
      }
    }
    return p
  })
}
