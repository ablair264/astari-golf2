import React, { useEffect, useState } from 'react'
import { X, Percent, Tag, Hash, Loader2, Check, AlertCircle } from 'lucide-react'

const API_RULES = '/.netlify/functions/margin-rules'

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) throw new Error(data.error || res.statusText)
  return data
}

/**
 * Modal for creating/editing a margin rule for a specific SKU
 */
export default function SkuRuleModal({ open, onClose, variant, existingRule, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    margin_percentage: 10,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open && variant) {
      // If there's an existing rule, populate the form
      if (existingRule) {
        setForm({
          name: existingRule.name || `${variant.name} Margin`,
          margin_percentage: existingRule.margin_percentage || 10,
        })
      } else {
        setForm({
          name: `${variant.brand || ''} ${variant.name} Override`.trim(),
          margin_percentage: variant.margin_percentage || 10,
        })
      }
      setSuccess(false)
      setError(null)
    }
  }, [open, variant, existingRule])

  if (!open || !variant) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = {
        name: form.name,
        rule_type: 'sku',
        margin_percentage: Number(form.margin_percentage),
        sku: variant.sku,
        brand_id: null,
        category_id: null,
        style_no: null,
      }

      if (existingRule) {
        // Update existing rule
        await fetchJSON(`${API_RULES}/${existingRule.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      } else {
        // Create new rule
        await fetchJSON(API_RULES, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }

      setSuccess(true)
      if (onSaved) onSaved()
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const basePrice = parseFloat(variant.price || 0)
  const marginPct = Number(form.margin_percentage) || 0
  const calculatedPrice = basePrice * (1 + marginPct / 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold">
              {existingRule ? 'Edit SKU Rule' : 'Create SKU Rule'}
            </h3>
            <p className="text-sm text-white/50 mt-0.5">Set margin for this specific product</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Product Info */}
        <div className="px-5 py-4 bg-white/5 border-b border-white/10">
          <div className="flex items-start gap-4">
            {variant.image_url ? (
              <img
                src={variant.image_url}
                alt={variant.name}
                className="w-16 h-16 rounded-lg object-cover bg-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                <Tag className="w-6 h-6 text-white/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wide">
                <span>{variant.brand}</span>
                {variant.style_no && (
                  <>
                    <span className="text-white/30">·</span>
                    <span>Style {variant.style_no}</span>
                  </>
                )}
              </div>
              <h4 className="text-white font-semibold mt-0.5 truncate">{variant.name}</h4>
              <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {variant.sku}
                </span>
                {variant.colour_name && (
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: variant.colour_hex || '#888' }}
                    />
                    {variant.colour_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-white/70 font-medium">Rule Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-white/70 font-medium flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Margin Percentage
            </label>
            <input
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={form.margin_percentage}
              onChange={(e) => setForm((p) => ({ ...p, margin_percentage: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              required
            />
          </div>

          {/* Price Preview */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <div className="text-xs text-emerald-400/80 uppercase tracking-wide mb-2">Price Preview</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-white/50 text-xs mb-1">Base Price</div>
                <div className="text-white font-semibold">£{basePrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs mb-1">Margin</div>
                <div className="text-emerald-400 font-semibold">+{marginPct}%</div>
              </div>
              <div>
                <div className="text-white/50 text-xs mb-1">Final Price</div>
                <div className="text-white font-bold text-lg">£{calculatedPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Priority Note */}
          <div className="text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2">
            <strong className="text-white/60">Priority 1</strong> – SKU rules override all other rules (brand, category, style).
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4 shrink-0" />
              Rule saved successfully!
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                existingRule ? 'Update Rule' : 'Create Rule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
