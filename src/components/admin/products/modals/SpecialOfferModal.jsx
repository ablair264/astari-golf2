import React, { useState } from 'react'
import { X, Tag, Percent, Hash } from 'lucide-react'

export default function SpecialOfferModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    discount_percentage: 10,
    brand_id: '',
    category_id: '',
    style_no: '',
    sku: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        discount_percentage: Number(form.discount_percentage),
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        style_no: form.style_no ? Number(form.style_no) : null,
        sku: form.sku || null,
      }
      onSave(payload)
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
          <h3 className="text-lg font-semibold">Create Special Offer</h3>
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
            <label className="text-sm text-white/70">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-white/70 flex items-center gap-1"><Percent className="w-4 h-4" /> Discount %</label>
              <input
                type="number"
                value={form.discount_percentage}
                onChange={(e) => setForm((p) => ({ ...p, discount_percentage: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/70">Brand ID</label>
              <input
                value={form.brand_id}
                onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                placeholder="optional"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/70">Category ID</label>
              <input
                value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                placeholder="optional"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/70">Style No</label>
              <input
                value={form.style_no}
                onChange={(e) => setForm((p) => ({ ...p, style_no: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                placeholder="optional"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/70 flex items-center gap-1"><Hash className="w-4 h-4" /> SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                placeholder="optional"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-300">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-60">
              {saving ? 'Saving...' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
