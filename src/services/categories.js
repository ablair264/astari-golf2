import { query } from '@/lib/neonClient'

export const getCategories = async () => {
  return query('SELECT * FROM categories ORDER BY name')
}

export const createCategory = async (data) => {
  const rows = await query(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
    [data.name, data.slug, data.description || '']
  )
  return rows[0]
}

export const updateCategory = async (id, data) => {
  const rows = await query(
    'UPDATE categories SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *',
    [data.name, data.slug, data.description || '', id]
  )
  return rows[0]
}

export const deleteCategory = async (id) => {
  await query('DELETE FROM categories WHERE id = $1', [id])
}
