import React, { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { ImageDropzone } from '@/components/admin/ImageDropzone'
import { createProduct, updateProduct } from '@/services/products'

// Mode: 'create' | 'style' | 'variant'
// - create: Full form for new product
// - style: Edit style-level fields (affects all variants): name, description, images, category
// - variant: Edit variant-level fields: price, stock, colour, individual image

export function ProductFormModal({ open, onClose, product, brands = [], categories = [], mode = 'create', onSaved }) {
  const isEdit = Boolean(product)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    price: '',
    brand_id: '',
    category_id: '',
    description: '',
    images: [],
    image_url: '',
    style_no: '',
    sku: '',
    colour_name: '',
    colour_hex: '',
    stock_quantity: '',
  })

  useEffect(() => {
    if (product) {
      // Parse images from JSON string if needed
      let images = []
      if (product.images) {
        try {
          images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
        } catch {
          images = []
        }
      }
      // Fallback: if no images array but has image_url, use that
      if (images.length === 0 && product.image_url) {
        images = [product.image_url]
      }

      setForm({
        name: product.name || '',
        price: product.price || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || '',
        description: product.description || '',
        images,
        image_url: product.image_url || '',
        style_no: product.style_no || '',
        sku: product.sku || '',
        colour_name: product.colour_name || '',
        colour_hex: product.colour_hex || '',
        stock_quantity: product.stock_quantity || '',
      })
    } else {
      setForm({
        name: '',
        price: '',
        brand_id: '',
        category_id: '',
        description: '',
        images: [],
        image_url: '',
        style_no: '',
        sku: '',
        colour_name: '',
        colour_hex: '',
        stock_quantity: '',
      })
    }
  }, [product, open])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleImagesChange = (urls) => {
    setForm((prev) => ({
      ...prev,
      images: urls,
      image_url: urls[0] || ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (mode === 'style' && product?.style_no) {
        // Style-level update: PUT /products-admin/style/:styleNo
        const res = await fetch(`/.netlify/functions/products-admin/style/${product.style_no}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            images: form.images,
            category_id: form.category_id || null
          })
        })
        if (!res.ok) throw new Error('Failed to update style')
      } else if (mode === 'variant' && product?.sku) {
        // Variant-level update
        await updateProduct(product.id || product.sku, {
          price: form.price,
          colour_name: form.colour_name,
          colour_hex: form.colour_hex,
          stock_quantity: form.stock_quantity,
          image_url: form.images[0] || form.image_url
        })
      } else if (isEdit) {
        // Full product update
        await updateProduct(product.id || product.sku, {
          ...form,
          image_url: form.images[0] || form.image_url
        })
      } else {
        // Create new product
        await createProduct({
          ...form,
          image_url: form.images[0] || form.image_url
        })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      console.error('Save failed', err)
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const brandObj = brands.find((b) => b.id === Number(form.brand_id))

  const getTitle = () => {
    if (mode === 'style') return 'Edit Style'
    if (mode === 'variant') return 'Edit Variant'
    return isEdit ? 'Edit Product' : 'Add Product'
  }

  const getSubtitle = () => {
    if (mode === 'style' && product?.style_no) return `Style #${product.style_no} • Updates all variants`
    if (mode === 'variant' && product?.sku) return `SKU: ${product.sku}`
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-semibold">{getTitle()}</h3>
            {getSubtitle() && (
              <p className="text-xs text-white/50 mt-0.5">{getSubtitle()}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg" disabled={saving}>
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Style-level fields */}
          {(mode === 'style' || mode === 'create') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name">
                  <input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    required
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category_id}
                    onChange={(e) => handleChange('category_id', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                  >
                    <option value="" className="bg-[#0f1621]">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0f1621]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 resize-none"
                />
              </Field>

              {/* Image Dropzone */}
              <ImageDropzone
                images={form.images}
                onImagesChange={handleImagesChange}
                brand={brandObj?.slug || 'astari'}
                maxFiles={10}
                label="Product Images"
              />
            </>
          )}

          {/* Variant-level fields */}
          {(mode === 'variant' || mode === 'create') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mode === 'create' && (
                  <>
                    <Field label="Brand">
                      <select
                        value={form.brand_id}
                        onChange={(e) => handleChange('brand_id', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                        required
                      >
                        <option value="" className="bg-[#0f1621]">Select brand</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id} className="bg-[#0f1621]">
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Style No">
                      <input
                        value={form.style_no}
                        onChange={(e) => handleChange('style_no', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                      />
                    </Field>
                    <Field label="SKU">
                      <input
                        value={form.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                        required
                      />
                    </Field>
                  </>
                )}

                <Field label="Price (£)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    required={mode === 'create'}
                  />
                </Field>

                <Field label="Stock Quantity">
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>

                <Field label="Colour Name">
                  <input
                    value={form.colour_name}
                    onChange={(e) => handleChange('colour_name', e.target.value)}
                    placeholder="e.g. Navy Blue"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>

                <Field label="Colour Hex">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.colour_hex || '#ffffff'}
                      onChange={(e) => handleChange('colour_hex', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      value={form.colour_hex}
                      onChange={(e) => handleChange('colour_hex', e.target.value)}
                      placeholder="#000000"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    />
                  </div>
                </Field>
              </div>

              {/* Variant image (single) for variant mode */}
              {mode === 'variant' && (
                <ImageDropzone
                  images={form.images}
                  onImagesChange={handleImagesChange}
                  brand={brandObj?.slug || product?.brand?.toLowerCase().replace(/\s+/g, '-') || 'astari'}
                  maxFiles={1}
                  multiple={false}
                  label="Variant Image"
                />
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">{label}</label>
    {children}
  </div>
)

export default ProductFormModal
