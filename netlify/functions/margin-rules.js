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
      calculated_price = ROUND(price * (1 + ${margin}/100), 2),
      final_price = CASE
        WHEN is_special_offer AND offer_discount_percentage IS NOT NULL
          THEN ROUND(ROUND(price * (1 + ${margin}/100), 2) * (1 - offer_discount_percentage/100), 2)
        ELSE ROUND(price * (1 + ${margin}/100), 2)
      END,
      applied_rule_id = ${rule.id},
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

    // List rules
    if (method === 'GET' && (path === '' || path === '/')) {
      const rules = await sql`SELECT * FROM margin_rules ORDER BY created_at DESC`
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, rules }) }
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
