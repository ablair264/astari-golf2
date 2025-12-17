import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const applyRuleToProducts = async (rule) => {
  const conditions = []
  if (rule.brand_id) conditions.push(`p.brand_id = ${rule.brand_id}`)
  if (rule.category_id) conditions.push(`p.category_id = ${rule.category_id}`)
  if (rule.style_no) conditions.push(`p.style_no = ${rule.style_no}`)
  if (rule.sku) conditions.push(`p.sku = '${rule.sku.replace(/'/g, "''")}'`)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  if (!where) return { updated: 0 }

  const margin = Number(rule.margin_percentage)
  const query = `
    UPDATE products p
    SET
      margin_percentage = ${margin},
      calculated_price = ROUND(price * (1 + ${margin}/100.0), 2),
      final_price = CASE
        WHEN is_special_offer AND offer_discount_percentage IS NOT NULL
          THEN ROUND(ROUND(price * (1 + ${margin}/100.0), 2) * (1 - offer_discount_percentage/100.0), 2)
        ELSE ROUND(price * (1 + ${margin}/100.0), 2)
      END,
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
    const path = url.pathname.replace('/.netlify/functions/margin-rules', '')
    const method = event.httpMethod

    // List rules with affected counts
    if (method === 'GET' && (path === '' || path === '/')) {
      const rules = await sql`
        SELECT mr.*,
          (SELECT COUNT(*) FROM products p WHERE
            (mr.sku IS NULL OR p.sku = mr.sku) AND
            (mr.style_no IS NULL OR p.style_no = mr.style_no) AND
            (mr.category_id IS NULL OR p.category_id = mr.category_id) AND
            (mr.brand_id IS NULL OR p.brand_id = mr.brand_id) AND
            (mr.sku IS NOT NULL OR mr.style_no IS NOT NULL OR mr.category_id IS NOT NULL OR mr.brand_id IS NOT NULL)
          ) as affected_count
        FROM margin_rules mr
        ORDER BY mr.created_at DESC
      `
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, rules }) }
    }

    // Preview rule impact (without applying)
    if (method === 'POST' && path === '/preview') {
      const body = JSON.parse(event.body || '{}')
      const { brand_id, category_id, style_no, sku, margin_percentage } = body
      const margin = Number(margin_percentage) || 0

      const conditions = []
      if (sku) conditions.push(`p.sku = '${sku.replace(/'/g, "''")}'`)
      if (style_no) conditions.push(`p.style_no = '${String(style_no).replace(/'/g, "''")}'`)
      if (category_id) conditions.push(`p.category_id = ${category_id}`)
      if (brand_id) conditions.push(`p.brand_id = ${brand_id}`)

      if (conditions.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'At least one filter required' }) }
      }

      const where = `WHERE ${conditions.join(' AND ')}`

      // Get aggregate stats
      const statsQuery = `
        SELECT
          COUNT(*) as total_affected,
          AVG(p.price) as avg_cost,
          AVG(p.price * (1 + ${margin}/100.0)) as avg_new_price,
          MIN(p.price * (1 + ${margin}/100.0)) as min_new_price,
          MAX(p.price * (1 + ${margin}/100.0)) as max_new_price
        FROM products p
        ${where}
      `
      const stats = await sql(statsQuery)

      // Get sample products (up to 5)
      const samplesQuery = `
        SELECT p.sku, p.name, p.style_no, p.price,
          p.margin_percentage as current_margin,
          p.calculated_price as current_price,
          ROUND(p.price * (1 + ${margin}/100.0), 2) as new_price,
          b.name as brand_name,
          c.name as category_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        ${where}
        LIMIT 5
      `
      const samples = await sql(samplesQuery)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          preview: {
            totalAffected: Number(stats[0]?.total_affected) || 0,
            avgCost: Number(stats[0]?.avg_cost) || 0,
            avgNewPrice: Number(stats[0]?.avg_new_price) || 0,
            minNewPrice: Number(stats[0]?.min_new_price) || 0,
            maxNewPrice: Number(stats[0]?.max_new_price) || 0,
            marginPercentage: margin,
            samples
          }
        })
      }
    }

    // Create rule
    if (method === 'POST' && (path === '' || path === '/')) {
      const body = JSON.parse(event.body || '{}')
      const { name, rule_type, margin_percentage, brand_id, category_id, style_no, sku } = body
      const inserted = await sql`
        INSERT INTO margin_rules (name, rule_type, margin_percentage, brand_id, category_id, style_no, sku)
        VALUES (${name}, ${rule_type}, ${margin_percentage}, ${brand_id || null}, ${category_id || null}, ${style_no || null}, ${sku || null})
        RETURNING *
      `
      const rule = inserted[0]
      const applied = await applyRuleToProducts(rule)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, rule, applied }) }
    }

    // Update rule and reapply
    if (method === 'PUT' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))
      const body = JSON.parse(event.body || '{}')
      const { name, rule_type, margin_percentage, brand_id, category_id, style_no, sku } = body
      const updated = await sql`
        UPDATE margin_rules
        SET
          name = ${name},
          rule_type = ${rule_type},
          margin_percentage = ${margin_percentage},
          brand_id = ${brand_id || null},
          category_id = ${category_id || null},
          style_no = ${style_no || null},
          sku = ${sku || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      if (updated.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
      const rule = updated[0]
      const applied = await applyRuleToProducts(rule)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, rule, applied }) }
    }

    // Delete rule
    if (method === 'DELETE' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))
      await sql`DELETE FROM margin_rules WHERE id = ${id}`
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
  } catch (error) {
    console.error('margin-rules error', error)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) }
  }
}
