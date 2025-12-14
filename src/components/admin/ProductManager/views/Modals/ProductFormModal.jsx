import React, { useEffect, useState } from 'react'
import { X, UploadCloud } from 'lucide-react'
import { getSignedUploadUrl, uploadFileToSignedUrl } from '@/services/uploads'
import { createProduct, updateProduct } from '@/services/products'

export function ProductFormModal({ open, onClose, product, brands, onSaved }) {
  const isEdit = Boolean(product)
  const [form, setForm] = useState({
    name: '',
    price: '',
    brand_id: '',
    category_id: '',
    description: '',
    image_url: '',
    style_no: '',
    sku: '',
    colour_name: '',
    colour_hex: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        price: product.price || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || '',
        description: product.description || '',
        image_url: product.image_url || '',
        style_no: product.style_no || '',
        sku: product.sku || '',
        colour_name: product.colour_name || '',
        colour_hex: product.colour_hex || '',
      })
    }
  }, [product])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        setUploading(true)
        const brandSlug = brands.find((b) => b.id === Number(form.brand_id))?.slug || 'astari'
        const { uploadUrl, publicUrl } = await getSignedUploadUrl(brandSlug, file.name)
        await uploadFileToSignedUrl(uploadUrl, file)
        setForm((prev) => ({ ...prev, image_url: publicUrl }))
      } catch (err) {
        console.error('Upload failed', err)
        alert('Upload failed')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEdit) {
        await updateProduct(product.id, form)
      } else {
        await createProduct(form)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      console.error('Save failed', err)
      alert('Failed to save product')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                required
              />
            </Field>
            <Field label="Price">
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                required
              />
            </Field>
            <Field label="Brand">
              <select
                value={form.brand_id}
                onChange={(e) => handleChange('brand_id', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
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
            <Field label="Category ID">
              <input
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
            </Field>
            <Field label="Style No">
              <input
                value={form.style_no}
                onChange={(e) => handleChange('style_no', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
            </Field>
            <Field label="SKU">
              <input
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
            </Field>
            <Field label="Colour Name">
              <input
                value={form.colour_name}
                onChange={(e) => handleChange('colour_name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
            </Field>
            <Field label="Colour Hex">
              <input
                value={form.colour_hex}
                onChange={(e) => handleChange('colour_hex', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
          </Field>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Field label="Image URL">
                <input
                  value={form.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-2"
            >
              <UploadCloud className="w-5 h-5" /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600"
            >
              {isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm text-white/70">{label}</label>
    {children}
  </div>
)
