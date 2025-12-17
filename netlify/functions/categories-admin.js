import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_NEON_DATABASE_URL)

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers }

  try {
    const url = new URL(event.rawUrl)
    const path = url.pathname.replace('/.netlify/functions/categories-admin', '')
    const method = event.httpMethod

    // List all categories
    if (method === 'GET' && (path === '' || path === '/')) {
      const categories = await sql`
        SELECT c.*,
          p.name as parent_name,
          (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        ORDER BY c.display_order, c.name
      `
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, categories }) }
    }

    // Get single category
    if (method === 'GET' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))
      const categories = await sql`
        SELECT c.*,
          p.name as parent_name,
          (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.id = ${id}
      `
      if (categories.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Category not found' }) }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, category: categories[0] }) }
    }

    // Create category
    if (method === 'POST' && (path === '' || path === '/')) {
      const body = JSON.parse(event.body || '{}')
      const { name, slug, description, image_url, parent_id, display_order } = body

      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Name is required' }) }
      }

      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const inserted = await sql`
        INSERT INTO categories (name, slug, description, image_url, parent_id, display_order)
        VALUES (
          ${name},
          ${generatedSlug},
          ${description || ''},
          ${image_url || ''},
          ${parent_id || null},
          ${display_order || 0}
        )
        RETURNING *
      `
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, category: inserted[0] }) }
    }

    // Update category
    if (method === 'PUT' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))
      const body = JSON.parse(event.body || '{}')
      const { name, slug, description, image_url, parent_id, display_order } = body

      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Name is required' }) }
      }

      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const updated = await sql`
        UPDATE categories
        SET
          name = ${name},
          slug = ${generatedSlug},
          description = ${description || ''},
          image_url = ${image_url || ''},
          parent_id = ${parent_id || null},
          display_order = ${display_order || 0},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `

      if (updated.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Category not found' }) }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, category: updated[0] }) }
    }

    // Delete category
    if (method === 'DELETE' && /^\/[0-9]+$/.test(path)) {
      const id = Number(path.substring(1))

      // First unset parent_id for any child categories
      await sql`UPDATE categories SET parent_id = NULL WHERE parent_id = ${id}`

      // Then unset category_id for products in this category
      await sql`UPDATE products SET category_id = NULL WHERE category_id = ${id}`

      // Finally delete the category
      await sql`DELETE FROM categories WHERE id = ${id}`

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) }
  } catch (error) {
    console.error('categories-admin error', error)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) }
  }
}
