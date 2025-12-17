import React, { useEffect, useState } from 'react'
import { X, Tag, Percent, Hash, Building2, FolderTree, Layers, Calendar } from 'lucide-react'

const API_BRANDS = '/.netlify/functions/products-admin/brands-list'
const API_CATEGORIES = '/.netlify/functions/products-admin/categories-list'
const API_STYLES = '/.netlify/functions/products-admin/styles-list'
const API_SKUS = '/.netlify/functions/products-admin/skus-list'

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) throw new Error(data.error || res.statusText)
  return data
}

export default function SpecialOfferModal({ open, onClose, onSave, offer = null }) {
  const isEdit = !!offer
  const [form, setForm] = useState({
    name: '',
    description: '',
    offer_type: 'brand',
    discount_percentage: 10,
    brand_id: '',
    category_id: '',
    style_no: '',
    sku: '',
    start_date: '',
    end_date: '',
  })
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [styles, setStyles] = useState([])
  const [skus, setSkus] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    const loadOptions = async () => {
      try {
        const [b, c, s, k] = await Promise.all([
          fetchJSON(API_BRANDS).catch(() => ({ brands: [] })),
          fetchJSON(API_CATEGORIES).catch(() => ({ categories: [] })),
          fetchJSON(API_STYLES).catch(() => ({ styles: [] })),
          fetchJSON(API_SKUS).catch(() => ({ skus: [] })),
        ])
        setBrands(b.brands || [])
        setCategories(c.categories || [])
        setStyles(s.styles || [])
        setSkus(k.skus || [])
      } catch (err) {
        console.warn('Unable to load dropdown options', err)
      }
    }
    loadOptions()

    // If editing, populate form
    if (offer) {
      const offerType = offer.sku ? 'sku' : offer.style_no ? 'style' : offer.category_id ? 'category' : offer.brand_id ? 'brand' : 'global'
      setForm({
        name: offer.name || '',
        description: offer.description || '',
        offer_type: offerType,
        discount_percentage: offer.discount_percentage || 10,
        brand_id: offer.brand_id || '',
        category_id: offer.category_id || '',
        style_no: offer.style_no || '',
        sku: offer.sku || '',
        start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
        end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
      })
    } else {
      setForm({
        name: '',
        description: '',
        offer_type: 'brand',
        discount_percentage: 10,
        brand_id: '',
        category_id: '',
        style_no: '',
        sku: '',
        start_date: '',
        end_date: '',
      })
    }
  }, [open, offer])

  if (!open) return null

  const handleOfferTypeChange = (value) => {
    setForm((p) => ({
      ...p,
      offer_type: value,
      brand_id: '',
      category_id: '',
      style_no: '',
      sku: '',
    }))
  }

  const isBrandOffer = form.offer_type === 'brand'
  const isCategoryOffer = form.offer_type === 'category'
  const isStyleOffer = form.offer_type === 'style'
  const isSkuOffer = form.offer_type === 'sku'
  const isGlobalOffer = form.offer_type === 'global'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        discount_percentage: Number(form.discount_percentage),
        brand_id: isBrandOffer && form.brand_id ? Number(form.brand_id) : null,
        category_id: isCategoryOffer && form.category_id ? Number(form.category_id) : null,
        style_no: isStyleOffer && form.style_no ? Number(form.style_no) : null,
        sku: isSkuOffer && form.sku ? form.sku : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      await onSave(payload, offer?.id)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f1621] z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Tag className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold">{isEdit ? 'Edit Special Offer' : 'Create Special Offer'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-white/70 font-medium">Offer Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="e.g. Summer Sale 20% Off"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70 font-medium">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-none"
              rows={2}
              placeholder="Describe this offer..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium">Offer Type</label>
              <select
                value={form.offer_type}
                onChange={(e) => handleOfferTypeChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
              >
                <option value="brand" className="bg-[#0f1621]">Brand</option>
                <option value="category" className="bg-[#0f1621]">Category</option>
                <option value="style" className="bg-[#0f1621]">Style Number</option>
                <option value="sku" className="bg-[#0f1621]">SKU</option>
                <option value="global" className="bg-[#0f1621]">Global (All Products)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Percent className="w-4 h-4" /> Discount %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discount_percentage}
                onChange={(e) => setForm((p) => ({ ...p, discount_percentage: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                required
              />
            </div>
          </div>

          {/* Target selector based on type */}
          {isBrandOffer && (
            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Building2 className="w-4 h-4" /> Brand
              </label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                required
              >
                <option value="" className="bg-[#0f1621]">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#0f1621]">{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {isCategoryOffer && (
            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <FolderTree className="w-4 h-4" /> Category
              </label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                required
              >
                <option value="" className="bg-[#0f1621]">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0f1621]">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {isStyleOffer && (
            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Layers className="w-4 h-4" /> Style Number
              </label>
              <select
                value={form.style_no}
                onChange={(e) => setForm((p) => ({ ...p, style_no: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                required
              >
                <option value="" className="bg-[#0f1621]">Select style number</option>
                {styles.map((s) => (
                  <option key={s.style_no} value={s.style_no} className="bg-[#0f1621]">
                    {s.style_no} {s.style_name ? `– ${s.style_name}` : ''} {s.brand ? `(${s.brand})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isSkuOffer && (
            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Hash className="w-4 h-4" /> SKU
              </label>
              <select
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
                required
              >
                <option value="" className="bg-[#0f1621]">Select SKU</option>
                {skus.map((k) => (
                  <option key={k.sku} value={k.sku} className="bg-[#0f1621]">
                    {k.sku} {k.name ? `– ${k.name}` : ''} {k.brand ? `(${k.brand})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isGlobalOffer && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
              This offer will apply to all products.
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Start Date (optional)
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" /> End Date (optional)
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 transition-all">
              {saving ? 'Saving...' : isEdit ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
