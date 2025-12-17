import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const applyOfferToProducts = async (offer) => {
  const conditions = []
  if (offer.brand_id) conditions.push(`p.brand_id = ${offer.brand_id}`)
  if (offer.category_id) conditions.push(`p.category_id = ${offer.category_id}`)
  if (offer.style_no) conditions.push(`CAST(p.style_no AS TEXT) = '${String(offer.style_no).replace(/'/g, "''")}'`)
  if (offer.sku) conditions.push(`p.sku = '${offer.sku.replace(/'/g, "''")}'`)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  if (!where) return { updated: 0 }

  const discount = Number(offer.discount_percentage)
  const query = `
    UPDATE products p
    SET
      is_special_offer = true,
      offer_discount_percentage = ${discount},
      final_price = ROUND(
        COALESCE(calculated_price, price)
        * (1 - ${discount}/100),
        2
      ),
      updated_at = NOW()
    ${where}
  `
  const res = await sql(query)
  return { updated: res.count || res.rowCount || 0 }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers }

  try {
    const url = new URL(event.rawUrl)
    const path = url.pathname.replace('/.netlify/functions/special-offers', '')
    const method = event.httpMethod

    if (method === 'GET' && (path === '' || path === '/')) {
      const offers = await sql`SELECT * FROM special_offers ORDER BY created_at DESC`
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, offers }) }
    }

    if (method === 'POST' && (path === '' || path === '/')) {
      const body = JSON.parse(event.body || '{}')
      const { name, description, discount_percentage, brand_id, category_id, style_no, sku, starts_at, ends_at } = body
      const inserted = await sql`
        INSERT INTO special_offers (name, description, discount_percentage, brand_id, category_id, style_no, sku, starts_at, ends_at)
        VALUES (${name}, ${description || ''}, ${discount_percentage}, ${brand_id || null}, ${category_id || null}, ${style_no || null}, ${sku || null}, ${starts_at || null}, ${ends_at || null})
        RETURNING *
      `
      const offer = inserted[0]
      const applied = await applyOfferToProducts(offer)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, offer, applied }) }
    }

    if (method === 'PUT' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))
      const body = JSON.parse(event.body || '{}')
      const { name, description, discount_percentage, brand_id, category_id, style_no, sku, starts_at, ends_at } = body
      const updated = await sql`
        UPDATE special_offers
        SET
          name = ${name},
          description = ${description || ''},
          discount_percentage = ${discount_percentage},
          brand_id = ${brand_id || null},
          category_id = ${category_id || null},
          style_no = ${style_no || null},
          sku = ${sku || null},
          starts_at = ${starts_at || null},
          ends_at = ${ends_at || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      if (updated.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
      const offer = updated[0]
      const applied = await applyOfferToProducts(offer)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, offer, applied }) }
    }

    if (method === 'DELETE' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))
      await sql`DELETE FROM special_offers WHERE id = ${id}`
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
  } catch (error) {
    console.error('special-offers error', error)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) }
  }
}
