import { query } from '@/lib/neonClient'

export const getAllBrands = async () => {
  return query('SELECT * FROM brands ORDER BY name')
}

export const getBrand = async (id) => {
  const rows = await query('SELECT * FROM brands WHERE id = $1', [id])
  return rows[0] || null
}

export const createBrand = async (brandData) => {
  const rows = await query(
    `INSERT INTO brands (name, slug, description, website, logo_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      brandData.name,
      brandData.slug,
      brandData.description || '',
      brandData.website || '',
      brandData.logo_url || '',
      JSON.stringify(brandData.metadata || {})
    ]
  )
  return rows[0]
}

export const updateBrand = async (id, brandData) => {
  const rows = await query(
    `UPDATE brands
     SET name = $1,
         slug = $2,
         description = $3,
         website = $4,
         logo_url = $5,
         metadata = $6,
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      brandData.name,
      brandData.slug,
      brandData.description || '',
      brandData.website || '',
      brandData.logo_url || '',
      JSON.stringify(brandData.metadata || {}),
      id,
    ]
  )
  return rows[0]
}

export const deleteBrand = async (id) => {
  await query('DELETE FROM brands WHERE id = $1', [id])
}
