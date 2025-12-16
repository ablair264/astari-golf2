import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers }

  try {
    const url = new URL(event.rawUrl)
    const q = (url.searchParams.get('q') || '').trim()
    if (!q) return { statusCode: 200, headers, body: JSON.stringify({ success: true, results: [] }) }

    const like = `%${q}%`
    const rows = await sql`
      SELECT p.id, p.name, p.sku, p.style_no, p.price, p.image_url,
             c.name AS category, b.name AS brand
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.is_active = true
        AND (
          p.name ILIKE ${like} OR
          p.description ILIKE ${like} OR
          p.sku ILIKE ${like} OR
          CAST(p.style_no AS TEXT) ILIKE ${like} OR
          c.name ILIKE ${like} OR
          b.name ILIKE ${like}
        )
      ORDER BY p.created_at DESC
      LIMIT 20
    `
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, results: rows }) }
  } catch (error) {
    console.error('smart-search error', error)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) }
  }
}
