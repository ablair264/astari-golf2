import { query } from '@/lib/neonClient'

export const getCategories = async () => {
  return query('SELECT * FROM categories ORDER BY display_order, name')
}

export const getAllCategories = async () => {
  return query('SELECT * FROM categories ORDER BY display_order, name')
}

export const createCategory = async (data) => {
  const rows = await query(
    `INSERT INTO categories (name, slug, description, image_url, parent_id, display_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.name,
      data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      data.description || '',
      data.image_url || '',
      data.parent_id || null,
      data.display_order || 0
    ]
  )
  return rows[0]
}

export const updateCategory = async (id, data) => {
  const rows = await query(
    `UPDATE categories
     SET name = $1, slug = $2, description = $3, image_url = $4, parent_id = $5, display_order = $6
     WHERE id = $7 RETURNING *`,
    [
      data.name,
      data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      data.description || '',
      data.image_url || '',
      data.parent_id || null,
      data.display_order || 0,
      id
    ]
  )
  return rows[0]
}

export const deleteCategory = async (id) => {
  await query('DELETE FROM categories WHERE id = $1', [id])
}
