import React, { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, Package, Search } from 'lucide-react'
import { ImageDropzone } from '@/components/admin/ImageDropzone'

const API_BASE = '/.netlify/functions/products-admin'

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Mode: 'create' | 'style' | 'variant'
// - create: Full form for new product
// - style: Edit style-level fields (affects all variants): name, description, images, category
// - variant: Edit variant-level fields: price, stock, colour, individual image

export function ProductFormModal({ open, onClose, product, brands = [], categories = [], mode = 'create', onSaved }) {
  const isEdit = Boolean(product?.id || product?.sku)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: null, message: '' }) // 'success' | 'error' | null
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
    // Multipack fields
    is_multipack: false,
    pack_quantity: '',
    parent_product_id: '',
  })

  // For parent product search
  const [parentSearch, setParentSearch] = useState('')
  const [parentProducts, setParentProducts] = useState([])
  const [loadingParents, setLoadingParents] = useState(false)
  const [showParentDropdown, setShowParentDropdown] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)
  const debouncedParentSearch = useDebounce(parentSearch, 300)

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
        is_multipack: product.is_multipack || false,
        pack_quantity: product.pack_quantity || '',
        parent_product_id: product.parent_product_id || '',
      })
      // If editing a multipack with a parent, set selectedParent
      if (product.parent_product_id) {
        setSelectedParent({ id: product.parent_product_id, name: product.parent_name || `Product #${product.parent_product_id}` })
      }
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
        is_multipack: false,
        pack_quantity: '',
        parent_product_id: '',
      })
      setSelectedParent(null)
    }
    // Reset status when modal opens/closes
    setStatus({ type: null, message: '' })
    setParentSearch('')
    setShowParentDropdown(false)
  }, [product, open])

  // Search for parent products when typing
  useEffect(() => {
    if (!form.is_multipack || !debouncedParentSearch || debouncedParentSearch.length < 2) {
      setParentProducts([])
      return
    }

    const searchParents = async () => {
      setLoadingParents(true)
      try {
        const res = await fetch(`${API_BASE}?search=${encodeURIComponent(debouncedParentSearch)}&limit=20`)
        const data = await res.json()
        if (data.success && data.products) {
          // Filter out the current product and multipacks
          setParentProducts(data.products.filter(p => p.id !== product?.id && !p.is_multipack))
        }
      } catch (err) {
        console.error('Failed to search products:', err)
      } finally {
        setLoadingParents(false)
      }
    }

    searchParents()
  }, [debouncedParentSearch, form.is_multipack, product?.id])

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
    setStatus({ type: null, message: '' })

    try {
      let res
      let successMessage = ''

      if (mode === 'style' && product?.style_no) {
        // Style-level update: PUT /products-admin/style/:styleNo
        res = await fetch(`${API_BASE}/style/${product.style_no}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            images: form.images,
            category_id: form.category_id || null
          })
        })
        successMessage = 'Style updated successfully'
      } else if (mode === 'variant' && product?.sku) {
        // Variant-level update: PUT /products-admin/:sku
        res = await fetch(`${API_BASE}/${product.sku}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price: parseFloat(form.price) || undefined,
            colour_name: form.colour_name || undefined,
            colour_hex: form.colour_hex || undefined,
            stock_quantity: parseInt(form.stock_quantity) || undefined,
            image_url: form.images[0] || form.image_url || undefined
          })
        })
        successMessage = 'Variant updated successfully'
      } else if (isEdit && product?.sku) {
        // Full product update
        res = await fetch(`${API_BASE}/${product.sku}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            image_url: form.images[0] || form.image_url
          })
        })
        successMessage = 'Product updated successfully'
      } else {
        // Create new product
        res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            sku: form.sku,
            style_no: form.style_no || null,
            brand_id: form.brand_id || null,
            category_id: form.category_id || null,
            price: parseFloat(form.price) || 0,
            description: form.description || null,
            image_url: form.images[0] || form.image_url || null,
            images: form.images,
            colour_name: form.colour_name || null,
            colour_hex: form.colour_hex || null,
            stock_quantity: parseInt(form.stock_quantity) || 0,
            // Multipack fields
            is_multipack: form.is_multipack || false,
            pack_quantity: form.is_multipack ? parseInt(form.pack_quantity) || null : null,
            parent_product_id: form.is_multipack ? parseInt(form.parent_product_id) || null : null
          })
        })
        successMessage = 'Product created successfully'
      }

      const data = await res.json()

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Operation failed')
      }

      setStatus({ type: 'success', message: successMessage })

      // Call onSaved callback to refresh list
      onSaved?.()

      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose()
        setStatus({ type: null, message: '' })
      }, 1000)

    } catch (err) {
      console.error('Save failed', err)
      setStatus({ type: 'error', message: err.message || 'Failed to save' })
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
          {/* Status Message */}
          {status.type && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {status.message}
            </div>
          )}

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

              {/* Multipack Section */}
              {mode === 'create' && (
                <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Package className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Multipack Product</h4>
                        <p className="text-xs text-white/50">Create a bundle of multiple units</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('is_multipack', !form.is_multipack)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.is_multipack ? 'bg-purple-500' : 'bg-white/20'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_multipack ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {form.is_multipack && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                      <Field label="Pack Quantity">
                        <input
                          type="number"
                          min="2"
                          value={form.pack_quantity}
                          onChange={(e) => handleChange('pack_quantity', e.target.value)}
                          placeholder="e.g. 3, 6, 12"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                        />
                      </Field>

                      <Field label="Parent Product (Individual Item)">
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                              value={selectedParent ? selectedParent.name : parentSearch}
                              onChange={(e) => {
                                setParentSearch(e.target.value)
                                setSelectedParent(null)
                                handleChange('parent_product_id', '')
                                setShowParentDropdown(true)
                              }}
                              onFocus={() => setShowParentDropdown(true)}
                              placeholder="Search for parent product..."
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                            />
                          </div>

                          {/* Dropdown */}
                          {showParentDropdown && (parentProducts.length > 0 || loadingParents) && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a2030] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                              {loadingParents ? (
                                <div className="p-3 text-center text-white/50 text-sm">
                                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                  Searching...
                                </div>
                              ) : (
                                parentProducts.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedParent({ id: p.id, name: p.name, sku: p.sku })
                                      handleChange('parent_product_id', p.id)
                                      setShowParentDropdown(false)
                                      setParentSearch('')
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                                  >
                                    {p.image_url && (
                                      <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover bg-white/10" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white truncate">{p.name}</p>
                                      <p className="text-xs text-white/50">{p.sku} • £{parseFloat(p.price || 0).toFixed(2)}</p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {selectedParent && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 rounded-lg px-3 py-2">
                            <Package className="w-3.5 h-3.5" />
                            Selected: {selectedParent.name} {selectedParent.sku && `(${selectedParent.sku})`}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedParent(null)
                                handleChange('parent_product_id', '')
                              }}
                              className="ml-auto text-white/60 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </Field>
                    </div>
                  )}
                </div>
              )}

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
