#!/usr/bin/env node
/**
 * Product Import Script for Astari Golf
 *
 * Parses the supplier CSV, extracts style_no for grouping,
 * and prepares products for database import with is_active = false
 *
 * Usage: node scripts/import-products.js [input.csv] [--dry-run]
 */

import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Default values for new products
  isActive: false, // Products disabled by default
  defaultMargin: 0,
  defaultStockQuantity: 0,

  // Batch size for database inserts
  batchSize: 100,

  // Style number extraction patterns
  // Removes common variant suffixes to derive the base style number
  variantSuffixes: [
    // Colors
    /BK$/i, /BL$/i, /WH$/i, /RD$/i, /GR$/i, /GN$/i, /YL$/i, /OR$/i, /PK$/i, /PR$/i, /GY$/i, /NV$/i, /TN$/i,
    /BLACK$/i, /BLUE$/i, /WHITE$/i, /RED$/i, /GREEN$/i, /YELLOW$/i, /ORANGE$/i, /PINK$/i, /PURPLE$/i, /GREY$/i, /NAVY$/i,
    // Sizes
    /\d{2,3}(S|M|L|XL|XXL)?$/i, // 34S, 35M, etc.
    /STD$/i, /MID$/i, /JBO$/i, /JU$/i, /OS$/i,
    // Handedness
    /LH$/i, /RH$/i, /LHS$/i, /RHS$/i,
    // Pack quantities
    /\d+PK$/i, /\d+PC$/i,
  ],

  // Known color codes mapping
  colorCodes: {
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
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a URL-friendly slug from text
 */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract style number from SKU code
 * Removes variant-specific suffixes to get the base product style
 */
function extractStyleNo(sku) {
  if (!sku) return null

  let styleNo = sku.toUpperCase().trim()

  // First, try to identify common variant patterns and strip them
  // Pattern: BASE + VARIANT (e.g., GASCDBL + LO, GRPVE + S)

  // Remove "LO" suffix (Custom Logo variants)
  if (styleNo.endsWith('LO')) {
    styleNo = styleNo.slice(0, -2)
  }

  // Remove color codes at the end (2-character codes)
  for (const suffix of Object.keys(CONFIG.colorCodes)) {
    if (styleNo.endsWith(suffix) && styleNo.length > suffix.length + 3) {
      styleNo = styleNo.slice(0, -suffix.length)
      break
    }
  }

  // Remove size indicators at the end (e.g., 34S, 35M)
  const sizeMatch = styleNo.match(/(\d{2,3})(S|M|L|XL)?$/i)
  if (sizeMatch && styleNo.length > 6) {
    styleNo = styleNo.slice(0, -sizeMatch[0].length)
  }

  // Remove handedness indicators
  if (styleNo.match(/[LR]H(S)?$/i) && styleNo.length > 4) {
    styleNo = styleNo.replace(/[LR]H(S)?$/i, '')
  }

  // Remove pack quantity indicators
  if (styleNo.match(/\d+P[KC]?$/i)) {
    styleNo = styleNo.replace(/\d+P[KC]?$/i, '')
  }

  // If style number is too short after stripping, use the original SKU
  if (styleNo.length < 3) {
    return sku.toUpperCase()
  }

  return styleNo
}

/**
 * Extract color information from SKU or name
 */
function extractColor(sku, name) {
  const upperSku = (sku || '').toUpperCase()
  const lowerName = (name || '').toLowerCase()

  // Try to find color code in SKU
  for (const [code, color] of Object.entries(CONFIG.colorCodes)) {
    if (upperSku.endsWith(code) || upperSku.includes(code)) {
      return color
    }
  }

  // Try to find color in name
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
    if (lowerName.includes(pattern)) {
      return color
    }
  }

  return { name: null, hex: null }
}

/**
 * Extract size from SKU or name
 */
function extractSize(sku, name) {
  const combined = `${sku || ''} ${name || ''}`

  // Look for size patterns
  const patterns = [
    /(\d{2,3})"?\s*(std|standard)?/i,  // 34", 35 std
    /\b(S|M|L|XL|XXL)\b/i,              // S, M, L, XL
    /\b(standard|midsize|oversize|jumbo)\b/i,
    /\b(small|medium|large)\b/i,
  ]

  for (const pattern of patterns) {
    const match = combined.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  return null
}

/**
 * Clean and parse price value
 */
function parsePrice(value) {
  if (!value) return 0
  // Remove currency symbols and convert to number
  const cleaned = String(value).replace(/[£$€,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Clean HTML from bullet points and convert to plain text array
 */
function cleanBulletPoints(html) {
  if (!html) return []

  // Extract list items
  const items = html.match(/<li[^>]*>([^<]*)<\/li>/gi) || []
  return items.map(item =>
    item
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .trim()
  ).filter(item => item.length > 0)
}

/**
 * Clean description text
 */
function cleanDescription(text) {
  if (!text) return null
  return text
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim() || null
}

/**
 * Determine category from product name/description
 */
function inferCategory(name, description) {
  const text = `${name || ''} ${description || ''}`.toLowerCase()

  const categoryPatterns = {
    'Grips': ['grip', 'putter grip'],
    'Bags': ['bag', 'carry bag', 'stand bag', 'cart bag', 'pencil bag'],
    'Clubs': ['putter', 'driver', 'iron', 'wedge', 'wood', 'hybrid', 'club'],
    'Balls': ['ball', 'golf ball'],
    'Trolleys': ['trolley', 'cart', 'push cart', 'pull cart'],
    'Accessories': ['tee', 'glove', 'towel', 'marker', 'divot', 'umbrella', 'cover', 'headcover'],
    'Apparel': ['shirt', 'polo', 'trousers', 'shorts', 'jacket', 'cap', 'hat', 'socks'],
    'Training Aids': ['training', 'alignment', 'practice', 'swing', 'putting mat'],
  }

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        return category
      }
    }
  }

  return 'Accessories' // Default category
}

/**
 * Extract brand from product name
 */
function inferBrand(name, code) {
  const text = `${name || ''} ${code || ''}`.toUpperCase()

  const brandPatterns = {
    'Longridge': ['LONGRIDGE', 'LR'],
    'Clicgear': ['CLICGEAR', 'CLIC'],
    'Bettinardi': ['BETTINARDI', 'BET', 'BB1', 'QB'],
    'Bag Boy': ['BAG BOY', 'BAGBOY'],
    'Ecovessel': ['ECOVESSEL', 'GGEV'],
    'Champ': ['CHAMP', 'TECH'],
    'Lignum': ['LIGNUM'],
    'SuperStroke': ['SUPERSTROKE', 'SS'],
  }

  for (const [brand, patterns] of Object.entries(brandPatterns)) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        return brand
      }
    }
  }

  return 'Longridge' // Default brand (appears to be the main supplier)
}

// ============================================================================
// Main Processing Functions
// ============================================================================

/**
 * Parse CSV file and transform to product objects
 */
function parseCSV(filePath) {
  console.log(`📂 Reading CSV file: ${filePath}`)

  const fileContent = fs.readFileSync(filePath, 'utf-8')

  // Parse CSV with multiline support
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
  })

  console.log(`📊 Found ${records.length} rows in CSV`)

  return records
}

/**
 * Transform raw CSV record to product object
 */
function transformRecord(record) {
  const sku = record['Code']?.trim()
  if (!sku) return null

  const name = record['Name']?.trim()
  if (!name) return null

  const description = cleanDescription(record['Description'])
  const bulletPoints = cleanBulletPoints(record['Bullet Points'])

  // Combine description and bullet points
  let fullDescription = description || ''
  if (bulletPoints.length > 0) {
    fullDescription += (fullDescription ? '\n\n' : '') + bulletPoints.join('\n')
  }

  const color = extractColor(sku, name)
  const size = extractSize(sku, name)
  const styleNo = extractStyleNo(sku)
  const category = inferCategory(name, fullDescription)
  const brand = inferBrand(name, sku)

  // Parse prices (RRP columns have currency symbols)
  const gbpRrp = parsePrice(record['£ RRP'] || record['� RRP'])
  const eurRrp = parsePrice(record['€ RRP'] || record['� RRP.1'])
  const price = gbpRrp || eurRrp || 0

  return {
    sku,
    name,
    slug: slugify(`${name}-${sku}`),
    style_no: styleNo,
    description: fullDescription || null,
    price,

    // Variant info
    colour_name: color.name,
    colour_hex: color.hex,
    size,

    // Categorization (will be resolved to IDs)
    category_name: category,
    brand_name: brand,

    // Additional data
    upc_barcode: record['UPC Barcode']?.trim() || null,
    weight: record['Unit Weight with Packaging']?.trim() || null,
    dimensions: record['Single Packaging Dimensions']?.trim() || null,
    country_of_origin: record['Country of Origin']?.trim() || null,
    commodity_code: record['Commodity Code']?.trim() || null,

    // Default values
    stock_quantity: CONFIG.defaultStockQuantity,
    is_active: CONFIG.isActive,
    margin_percentage: CONFIG.defaultMargin,

    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Group products by style_no for analysis
 */
function groupByStyle(products) {
  const groups = {}

  for (const product of products) {
    const styleNo = product.style_no || product.sku
    if (!groups[styleNo]) {
      groups[styleNo] = []
    }
    groups[styleNo].push(product)
  }

  return groups
}

/**
 * Get or create brand ID
 */
async function getBrandId(brandName) {
  if (!brandName) return null

  const existing = await sql`SELECT id FROM brands WHERE LOWER(name) = LOWER(${brandName}) LIMIT 1`
  if (existing.length > 0) {
    return existing[0].id
  }

  const slug = slugify(brandName)
  const result = await sql`
    INSERT INTO brands (name, slug, created_at, updated_at)
    VALUES (${brandName}, ${slug}, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `
  return result[0].id
}

/**
 * Get or create category ID
 */
async function getCategoryId(categoryName) {
  if (!categoryName) return null

  const existing = await sql`SELECT id FROM categories WHERE LOWER(name) = LOWER(${categoryName}) LIMIT 1`
  if (existing.length > 0) {
    return existing[0].id
  }

  const slug = slugify(categoryName)
  const result = await sql`
    INSERT INTO categories (name, slug, created_at, updated_at)
    VALUES (${categoryName}, ${slug}, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `
  return result[0].id
}

/**
 * Insert products into database in batches
 */
async function insertProducts(products, dryRun = false) {
  console.log(`\n📦 Processing ${products.length} products...`)

  // Cache brand and category IDs
  const brandCache = {}
  const categoryCache = {}

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < products.length; i += CONFIG.batchSize) {
    const batch = products.slice(i, i + CONFIG.batchSize)
    console.log(`  Processing batch ${Math.floor(i / CONFIG.batchSize) + 1}/${Math.ceil(products.length / CONFIG.batchSize)}...`)

    for (const product of batch) {
      try {
        // Resolve brand_id
        let brandId = null
        if (product.brand_name) {
          if (!brandCache[product.brand_name]) {
            brandCache[product.brand_name] = await getBrandId(product.brand_name)
          }
          brandId = brandCache[product.brand_name]
        }

        // Resolve category_id
        let categoryId = null
        if (product.category_name) {
          if (!categoryCache[product.category_name]) {
            categoryCache[product.category_name] = await getCategoryId(product.category_name)
          }
          categoryId = categoryCache[product.category_name]
        }

        if (dryRun) {
          console.log(`    [DRY RUN] Would insert: ${product.sku} (style: ${product.style_no})`)
          inserted++
          continue
        }

        // Insert product
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
            ${product.price},
            ${product.description},
            ${product.colour_name},
            ${product.colour_hex},
            ${product.size},
            ${product.stock_quantity},
            ${product.is_active},
            ${product.margin_percentage},
            NOW(),
            NOW()
          )
          ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            style_no = EXCLUDED.style_no,
            brand_id = EXCLUDED.brand_id,
            category_id = EXCLUDED.category_id,
            price = EXCLUDED.price,
            description = EXCLUDED.description,
            colour_name = EXCLUDED.colour_name,
            colour_hex = EXCLUDED.colour_hex,
            size = EXCLUDED.size,
            updated_at = NOW()
        `

        inserted++
      } catch (error) {
        console.error(`    ❌ Error inserting ${product.sku}:`, error.message)
        errors++
      }
    }
  }

  return { inserted, skipped, errors }
}

/**
 * Generate analysis report
 */
function generateReport(products, groups) {
  const report = {
    totalProducts: products.length,
    totalStyles: Object.keys(groups).length,

    // Category breakdown
    byCategory: {},

    // Brand breakdown
    byBrand: {},

    // Style group sizes
    groupSizes: {
      single: 0,   // 1 variant
      small: 0,    // 2-5 variants
      medium: 0,   // 6-10 variants
      large: 0,    // 11+ variants
    },

    // Products with/without prices
    withPrice: 0,
    withoutPrice: 0,
  }

  for (const product of products) {
    // Category
    const cat = product.category_name || 'Unknown'
    report.byCategory[cat] = (report.byCategory[cat] || 0) + 1

    // Brand
    const brand = product.brand_name || 'Unknown'
    report.byBrand[brand] = (report.byBrand[brand] || 0) + 1

    // Price
    if (product.price > 0) {
      report.withPrice++
    } else {
      report.withoutPrice++
    }
  }

  // Group sizes
  for (const variants of Object.values(groups)) {
    const size = variants.length
    if (size === 1) report.groupSizes.single++
    else if (size <= 5) report.groupSizes.small++
    else if (size <= 10) report.groupSizes.medium++
    else report.groupSizes.large++
  }

  return report
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const inputFile = args.find(a => !a.startsWith('--')) || '/home/alastair/Downloads/ProductSpreadsheet.csv'
  const dryRun = args.includes('--dry-run')
  const reportOnly = args.includes('--report')

  console.log('🏌️ Astari Golf Product Import Script')
  console.log('=====================================')
  console.log(`Input file: ${inputFile}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : reportOnly ? 'REPORT ONLY' : 'LIVE IMPORT'}`)
  console.log('')

  try {
    // Parse CSV
    const records = parseCSV(inputFile)

    // Transform records
    console.log('\n🔄 Transforming records...')
    const products = records
      .map(transformRecord)
      .filter(p => p !== null)

    console.log(`✅ Transformed ${products.length} valid products`)

    // Group by style
    const groups = groupByStyle(products)
    console.log(`📊 Found ${Object.keys(groups).length} unique style groups`)

    // Generate report
    const report = generateReport(products, groups)

    console.log('\n📈 Import Analysis Report')
    console.log('-------------------------')
    console.log(`Total Products: ${report.totalProducts}`)
    console.log(`Unique Styles: ${report.totalStyles}`)
    console.log(`With Price: ${report.withPrice}`)
    console.log(`Without Price: ${report.withoutPrice}`)
    console.log('')
    console.log('Category Breakdown:')
    for (const [cat, count] of Object.entries(report.byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`)
    }
    console.log('')
    console.log('Brand Breakdown:')
    for (const [brand, count] of Object.entries(report.byBrand).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${brand}: ${count}`)
    }
    console.log('')
    console.log('Style Group Sizes:')
    console.log(`  Single variant: ${report.groupSizes.single}`)
    console.log(`  2-5 variants: ${report.groupSizes.small}`)
    console.log(`  6-10 variants: ${report.groupSizes.medium}`)
    console.log(`  11+ variants: ${report.groupSizes.large}`)

    // Show sample style groups
    console.log('\n📋 Sample Style Groups (first 5):')
    const sampleStyles = Object.entries(groups).slice(0, 5)
    for (const [styleNo, variants] of sampleStyles) {
      console.log(`  ${styleNo}: ${variants.length} variant(s)`)
      for (const v of variants.slice(0, 3)) {
        console.log(`    - ${v.sku}: ${v.name.slice(0, 50)}...`)
      }
      if (variants.length > 3) {
        console.log(`    ... and ${variants.length - 3} more`)
      }
    }

    if (reportOnly) {
      console.log('\n✅ Report complete (--report mode, no database changes)')
      return
    }

    // Insert into database
    console.log('\n💾 Starting database import...')
    console.log(`   Products will be inserted with is_active = ${CONFIG.isActive}`)

    const result = await insertProducts(products, dryRun)

    console.log('\n✅ Import Complete!')
    console.log(`   Inserted/Updated: ${result.inserted}`)
    console.log(`   Skipped: ${result.skipped}`)
    console.log(`   Errors: ${result.errors}`)

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no data was actually inserted')
      console.log('   Run without --dry-run to perform actual import')
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  }
}

main()
