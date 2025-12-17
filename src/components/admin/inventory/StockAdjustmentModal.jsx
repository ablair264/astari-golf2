import { useState } from 'react'
import { X, Loader2, Plus, Minus, Package } from 'lucide-react'

const reasons = [
  'Received shipment',
  'Sold (manual)',
  'Returned item',
  'Damaged/defective',
  'Inventory count',
  'Transfer',
  'Other'
]

const StockAdjustmentModal = ({ open, onClose, selectedProducts = [], onAdjust }) => {
  const [adjustmentType, setAdjustmentType] = useState('set')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState(reasons[0])
  const [customReason, setCustomReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const finalReason = reason === 'Other' ? customReason : reason
      await onAdjust({
        productIds: selectedProducts.map(p => p.id),
        adjustmentType,
        quantity: parseInt(quantity),
        reason: finalReason
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Adjust Stock</h3>
              <p className="text-xs text-white/50">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg" disabled={saving}>
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Selected Products Preview */}
          {selectedProducts.length > 0 && selectedProducts.length <= 5 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Selected Products
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{product.name}</p>
                      <p className="text-xs text-white/50">{product.sku} • Current: {product.stock_quantity ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adjustment Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  adjustmentType === 'set'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Set to
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  adjustmentType === 'add'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  adjustmentType === 'subtract'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Minus className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              {reasons.map((r) => (
                <option key={r} value={r} className="bg-[#0f1621]">
                  {r}
                </option>
              ))}
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 mt-2"
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || quantity < 0}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Adjusting...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockAdjustmentModal
