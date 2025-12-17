const { neon } = require('@neondatabase/serverless')
const { parse } = require('csv-parse/sync')

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ============================================================================
// Helper Functions
// ============================================================================

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Color codes mapping
const COLOR_CODES = {
  'BK': { name: 'Black', hex: '#000000' },
  'BL': { name: 'Blue', hex: '#0066CC' },
  'WH': { name: 'White', hex: '#FFFFFF' },
  'RD': { name: 'Red', hex: '#CC0000' },
  'GR': { name: 'Green', hex: '#00CC00' },
  'GN': { name: 'Green', hex: '#00CC00' },
  'YL': { name: 'Yellow', hex: '#FFCC00' },
  'OR': { name: 'Orange', hex: '#FF6600' },
  'PK': { name: 'Pink', hex: '#FF66CC' },
  'PR': { name: 'Purple', hex: '#6600CC' },
  'GY': { name: 'Grey', hex: '#808080' },
  'NV': { name: 'Navy', hex: '#000080' },
  'TN': { name: 'Tan', hex: '#D2B48C' },
}

function extractStyleNo(sku) {
  if (!sku) return null
  let styleNo = sku.toUpperCase().trim()

  // Remove "LO" suffix (Custom Logo variants)
  if (styleNo.endsWith('LO')) {
    styleNo = styleNo.slice(0, -2)
  }

  // Remove color codes at the end
  for (const suffix of Object.keys(COLOR_CODES)) {
    if (styleNo.endsWith(suffix) && styleNo.length > suffix.length + 3) {
      styleNo = styleNo.slice(0, -suffix.length)
      break
    }
  }

  // Remove size indicators
  const sizeMatch = styleNo.match(/(\d{2,3})(S|M|L|XL)?$/i)
  if (sizeMatch && styleNo.length > 6) {
    styleNo = styleNo.slice(0, -sizeMatch[0].length)
  }

  // Remove handedness
  if (styleNo.match(/[LR]H(S)?$/i) && styleNo.length > 4) {
    styleNo = styleNo.replace(/[LR]H(S)?$/i, '')
  }

  return styleNo.length < 3 ? sku.toUpperCase() : styleNo
}

function extractColor(sku, name) {
  const upperSku = (sku || '').toUpperCase()
  const lowerName = (name || '').toLowerCase()

  for (const [code, color] of Object.entries(COLOR_CODES)) {
    if (upperSku.endsWith(code)) return color
  }

  const colorPatterns = {
    'black': { name: 'Black', hex: '#000000' },
    'blue': { name: 'Blue', hex: '#0066CC' },
    'white': { name: 'White', hex: '#FFFFFF' },
    'red': { name: 'Red', hex: '#CC0000' },
    'green': { name: 'Green', hex: '#00CC00' },
    'yellow': { name: 'Yellow', hex: '#FFCC00' },
    'orange': { name: 'Orange', hex: '#FF6600' },
    'pink': { name: 'Pink', hex: '#FF66CC' },
    'purple': { name: 'Purple', hex: '#6600CC' },
    'grey': { name: 'Grey', hex: '#808080' },
    'gray': { name: 'Grey', hex: '#808080' },
    'navy': { name: 'Navy', hex: '#000080' },
    'silver': { name: 'Silver', hex: '#C0C0C0' },
    'gold': { name: 'Gold', hex: '#FFD700' },
  }

  for (const [pattern, color] of Object.entries(colorPatterns)) {
    if (lowerName.includes(pattern)) return color
  }

  return { name: null, hex: null }
}

function extractSize(sku, name) {
  const combined = `${sku || ''} ${name || ''}`
  const patterns = [
    /(\d{2,3})"?\s*(std|standard)?/i,
    /\b(S|M|L|XL|XXL)\b/i,
    /\b(standard|midsize|oversize|jumbo)\b/i,
  ]

  for (const pattern of patterns) {
    const match = combined.match(pattern)
    if (match) return match[0].trim()
  }
  return null
}

function parsePrice(value) {
  if (!value) return 0
  const cleaned = String(value).replace(/[£$€,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cleanBulletPoints(html) {
  if (!html) return []
  const items = html.match(/<li[^>]*>([^<]*)<\/li>/gi) || []
  return items.map(item =>
    item.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim()
  ).filter(item => item.length > 0)
}

function cleanDescription(text) {
  if (!text) return null
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null
}

function inferCategory(name, description) {
  const text = `${name || ''} ${description || ''}`.toLowerCase()
  const patterns = {
    'Grips': ['grip', 'putter grip'],
    'Bags': ['bag', 'carry bag', 'stand bag', 'cart bag', 'pencil bag'],
    'Clubs': ['putter', 'driver', 'iron', 'wedge', 'wood', 'hybrid'],
    'Balls': ['ball', 'golf ball'],
    'Trolleys': ['trolley', 'cart', 'push cart'],
    'Accessories': ['tee', 'glove', 'towel', 'marker', 'divot', 'umbrella', 'cover'],
    'Apparel': ['shirt', 'polo', 'trousers', 'shorts', 'jacket', 'cap'],
    'Training Aids': ['training', 'alignment', 'practice', 'swing'],
  }

  for (const [cat, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return cat
    }
  }
  return 'Accessories'
}

function inferBrand(name, code) {
  const text = `${name || ''} ${code || ''}`.toUpperCase()
  const patterns = {
    'Longridge': ['LONGRIDGE', 'LR'],
    'Clicgear': ['CLICGEAR', 'CLIC'],
    'Bettinardi': ['BETTINARDI', 'BET', 'BB1', 'QB'],
    'Bag Boy': ['BAG BOY', 'BAGBOY'],
    'Ecovessel': ['ECOVESSEL', 'GGEV'],
    'Champ': ['CHAMP', 'TECH'],
    'SuperStroke': ['SUPERSTROKE', 'SS'],
  }

  for (const [brand, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return brand
    }
  }
  return 'Longridge'
}

// ============================================================================
// Main Handler
// ============================================================================

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, csvData, options = {} } = body

    // Action: analyze - Parse CSV and return analysis without importing
    if (action === 'analyze') {
      if (!csvData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'No CSV data provided' })
        }
      }

      // Parse CSV
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        trim: true,
      })

      // Transform and analyze
      const products = []
      const skipped = []
      const styleGroups = {}
      const categories = {}
      const brands = {}

      for (const record of records) {
        const sku = record['Code']?.trim()
        const name = record['Name']?.trim()

        if (!sku || !name) {
          skipped.push({ sku: sku || 'N/A', reason: 'Missing SKU or name' })
          continue
        }

        const description = cleanDescription(record['Description'])
        const bulletPoints = cleanBulletPoints(record['Bullet Points'])
        let fullDescription = description || ''
        if (bulletPoints.length > 0) {
          fullDescription += (fullDescription ? '\n\n' : '') + bulletPoints.join('\n')
        }

        const color = extractColor(sku, name)
        const size = extractSize(sku, name)
        const styleNo = extractStyleNo(sku)
        const category = inferCategory(name, fullDescription)
        const brand = inferBrand(name, sku)

        const gbpRrp = parsePrice(record['£ RRP'] || record['� RRP'])
        const eurRrp = parsePrice(record['€ RRP'] || record['� RRP.1'])
        const price = gbpRrp || eurRrp || 0

        const product = {
          sku,
          name,
          slug: slugify(`${name}-${sku}`),
          style_no: styleNo,
          description: fullDescription || null,
          price,
          colour_name: color.name,
          colour_hex: color.hex,
          size,
          category_name: category,
          brand_name: brand,
          upc_barcode: record['UPC Barcode']?.trim() || null,
          country_of_origin: record['Country of Origin']?.trim() || null,
        }

        products.push(product)

        // Track style groups
        if (!styleGroups[styleNo]) styleGroups[styleNo] = []
        styleGroups[styleNo].push(sku)

        // Track categories and brands
        categories[category] = (categories[category] || 0) + 1
        brands[brand] = (brands[brand] || 0) + 1
      }

      // Build analysis summary
      const analysis = {
        totalRecords: records.length,
        validProducts: products.length,
        skippedRecords: skipped.length,
        uniqueStyles: Object.keys(styleGroups).length,
        categories: Object.entries(categories)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        brands: Object.entries(brands)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        withPrice: products.filter(p => p.price > 0).length,
        withoutPrice: products.filter(p => p.price === 0).length,
        styleGroupSizes: {
          single: Object.values(styleGroups).filter(g => g.length === 1).length,
          small: Object.values(styleGroups).filter(g => g.length >= 2 && g.length <= 5).length,
          medium: Object.values(styleGroups).filter(g => g.length >= 6 && g.length <= 10).length,
          large: Object.values(styleGroups).filter(g => g.length > 10).length,
        },
        sampleProducts: products.slice(0, 10),
        skippedDetails: skipped.slice(0, 20),
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, analysis, products })
      }
    }

    // Action: import - Actually import products to database
    if (action === 'import') {
      const { products, isActive = false, defaultMargin = 0 } = body

      if (!products || !Array.isArray(products) || products.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'No products to import' })
        }
      }

      // Cache for brand/category IDs
      const brandCache = {}
      const categoryCache = {}

      let inserted = 0
      let updated = 0
      let errors = []

      // Process in batches of 50
      const batchSize = 50
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)

        for (const product of batch) {
          try {
            // Get or create brand
            let brandId = null
            if (product.brand_name) {
              if (!brandCache[product.brand_name]) {
                const existing = await sql`SELECT id FROM brands WHERE LOWER(name) = LOWER(${product.brand_name}) LIMIT 1`
                if (existing.length > 0) {
                  brandCache[product.brand_name] = existing[0].id
                } else {
                  const brandSlug = slugify(product.brand_name)
                  const newBrand = await sql`
                    INSERT INTO brands (name, slug, created_at, updated_at)
                    VALUES (${product.brand_name}, ${brandSlug}, NOW(), NOW())
                    ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
                    RETURNING id
                  `
                  brandCache[product.brand_name] = newBrand[0].id
                }
              }
              brandId = brandCache[product.brand_name]
            }

            // Get or create category
            let categoryId = null
            if (product.category_name) {
              if (!categoryCache[product.category_name]) {
                const existing = await sql`SELECT id FROM categories WHERE LOWER(name) = LOWER(${product.category_name}) LIMIT 1`
                if (existing.length > 0) {
                  categoryCache[product.category_name] = existing[0].id
                } else {
                  const catSlug = slugify(product.category_name)
                  const newCat = await sql`
                    INSERT INTO categories (name, slug, created_at, updated_at)
                    VALUES (${product.category_name}, ${catSlug}, NOW(), NOW())
                    ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
                    RETURNING id
                  `
                  categoryCache[product.category_name] = newCat[0].id
                }
              }
              categoryId = categoryCache[product.category_name]
            }

            // Check if product exists
            const existing = await sql`SELECT id FROM products WHERE sku = ${product.sku} LIMIT 1`

            if (existing.length > 0) {
              // Update existing
              await sql`
                UPDATE products SET
                  name = ${product.name},
                  style_no = ${product.style_no},
                  brand_id = ${brandId},
                  category_id = ${categoryId},
                  price = ${product.price || 0},
                  description = ${product.description},
                  colour_name = ${product.colour_name},
                  colour_hex = ${product.colour_hex},
                  size = ${product.size},
                  updated_at = NOW()
                WHERE sku = ${product.sku}
              `
              updated++
            } else {
              // Insert new
              await sql`
                INSERT INTO products (
                  name, slug, sku, style_no, brand_id, category_id, price,
                  description, colour_name, colour_hex, size,
                  stock_quantity, is_active, margin_percentage,
                  created_at, updated_at
                ) VALUES (
                  ${product.name},
                  ${product.slug},
                  ${product.sku},
                  ${product.style_no},
                  ${brandId},
                  ${categoryId},
                  ${product.price || 0},
                  ${product.description},
                  ${product.colour_name},
                  ${product.colour_hex},
                  ${product.size},
                  0,
                  ${isActive},
                  ${defaultMargin},
                  NOW(),
                  NOW()
                )
              `
              inserted++
            }
          } catch (err) {
            errors.push({ sku: product.sku, error: err.message })
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          results: {
            inserted,
            updated,
            total: inserted + updated,
            errors: errors.length,
            errorDetails: errors.slice(0, 20)
          }
        })
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid action. Use "analyze" or "import"' })
    }

  } catch (error) {
    console.error('Import error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}
