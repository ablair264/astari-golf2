import React, { useEffect, useState } from 'react'
import { X, Percent, Hash, Building2, Layers, Tag } from 'lucide-react'

const API_RULES = '/.netlify/functions/margin-rules'
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

export default function RuleCreateModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    rule_type: 'brand',
    margin_percentage: 10,
    brand_id: '',
    category_id: '',
    style_no: '',
    sku: '',
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
  }, [open])

  if (!open) return null

  const handleRuleTypeChange = (value) => {
    setForm((p) => ({
      ...p,
      rule_type: value,
      brand_id: '',
      category_id: '',
      style_no: '',
      sku: '',
    }))
  }

  const priorityLabel = {
    sku: 1,
    product_override: 1,
    style: 2,
    style_no: 2,
    brand: 3,
    category: 4,
    default: 6,
  }[form.rule_type] || '-'

  const isBrandRule = form.rule_type === 'brand'
  const isCategoryRule = form.rule_type === 'category'
  const isStyleRule = form.rule_type === 'style' || form.rule_type === 'style_no'
  const isSkuRule = form.rule_type === 'sku' || form.rule_type === 'product_override'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        margin_percentage: Number(form.margin_percentage),
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        style_no: form.style_no ? Number(form.style_no) : null,
        sku: form.sku || null,
      }
      // Pass payload to parent - parent handles the API call
      if (onSave) {
        await onSave(payload)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold">Create Margin Rule</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-white/70">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70">Rule Type</label>
            <select
              value={form.rule_type}
              onChange={(e) => handleRuleTypeChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="brand" className="bg-[#0f1621]">Brand</option>
              <option value="category" className="bg-[#0f1621]">Category</option>
              <option value="style_no" className="bg-[#0f1621]">Style Number</option>
              <option value="sku" className="bg-[#0f1621]">SKU Override</option>
              <option value="default" className="bg-[#0f1621]">Default</option>
            </select>
            <div className="text-xs text-white/50">Priority {priorityLabel}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isBrandRule && (
              <div className="space-y-1 col-span-2">
                <label className="text-sm text-white/70 flex items-center gap-1"><Building2 className="w-4 h-4" /> Brand</label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  required
                >
                  <option value="" className="bg-[#0f1621]">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#0f1621]">{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-white/70 flex items-center gap-1"><Percent className="w-4 h-4" /> Margin %</label>
              <input
                type="number"
                value={form.margin_percentage}
                onChange={(e) => setForm((p) => ({ ...p, margin_percentage: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                required
              />
            </div>

            {isCategoryRule && (
              <div className="space-y-1 col-span-2">
                <label className="text-sm text-white/70 flex items-center gap-1"><Tag className="w-4 h-4" /> Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  required
                >
                  <option value="" className="bg-[#0f1621]">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0f1621]">{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isStyleRule && (
              <div className="space-y-1 col-span-2">
                <label className="text-sm text-white/70 flex items-center gap-1"><Layers className="w-4 h-4" /> Style Number</label>
                <select
                  value={form.style_no}
                  onChange={(e) => setForm((p) => ({ ...p, style_no: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
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

            {isSkuRule && (
              <div className="space-y-1 col-span-2">
                <label className="text-sm text-white/70 flex items-center gap-1"><Hash className="w-4 h-4" /> SKU</label>
                <select
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
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
          </div>

          {error && <div className="text-sm text-red-300">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-60">
              {saving ? 'Saving...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
