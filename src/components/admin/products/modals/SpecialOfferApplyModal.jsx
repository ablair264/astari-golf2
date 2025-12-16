import React, { useState, useEffect } from 'react'
import { X, Loader2, ArrowRight, Check, AlertCircle, Tag, Plus, Trash2 } from 'lucide-react'

export default function SpecialOfferApplyModal({ open, onClose, selectedSkus = [], onSuccess }) {
  const [mode, setMode] = useState('existing') // 'existing' | 'custom' | 'remove'
  const [offers, setOffers] = useState([])
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [customDiscount, setCustomDiscount] = useState('')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  // Fetch available offers on open
  useEffect(() => {
    if (open) {
      setLoading(true)
      fetch('/.netlify/functions/special-offers')
        .then(res => res.json())
        .then(data => {
          setOffers(data.offers || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch offers:', err)
          setLoading(false)
        })
      // Reset state
      setMode('existing')
      setSelectedOfferId('')
      setCustomDiscount('')
      setPreview(null)
      setError(null)
    }
  }, [open])

  const getDiscountPercentage = () => {
    if (mode === 'custom') {
      return parseFloat(customDiscount) || 0
    }
    if (mode === 'remove') {
      return 0
    }
    const offer = offers.find(o => o.id === Number(selectedOfferId))
    return offer?.discount_percentage || 0
  }

  const handlePreview = async () => {
    if (mode === 'existing' && !selectedOfferId) {
      setError('Please select an offer')
      return
    }
    if (mode === 'custom' && !customDiscount) {
      setError('Please enter a discount percentage')
      return
    }

    setError(null)
    const discount = getDiscountPercentage()
    const offerName = mode === 'existing'
      ? offers.find(o => o.id === Number(selectedOfferId))?.name
      : mode === 'custom'
        ? 'Custom Discount'
        : 'Remove Offer'

    setPreview({
      totalAffected: selectedSkus.length,
      discountPercentage: discount,
      offerName,
      isRemove: mode === 'remove'
    })
  }

  const handleApply = async () => {
    setApplying(true)
    setError(null)

    try {
      if (mode === 'remove') {
        // Remove special offer from selected products
        const response = await fetch('/.netlify/functions/products-admin/bulk/special-offer', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skuCodes: selectedSkus })
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to remove offer')
        }
      } else {
        // Apply special offer
        const response = await fetch('/.netlify/functions/products-admin/bulk/special-offer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skuCodes: selectedSkus,
            offerId: mode === 'existing' ? Number(selectedOfferId) : null,
            discountPercentage: getDiscountPercentage()
          })
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to apply offer')
        }
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      setApplying(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold">Special Offers</h3>
            <p className="text-xs text-white/50 mt-0.5">{selectedSkus.length} products selected</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => { setMode('existing'); setPreview(null); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                mode === 'existing'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Existing Offer
            </button>
            <button
              onClick={() => { setMode('custom'); setPreview(null); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                mode === 'custom'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Custom Discount
            </button>
            <button
              onClick={() => { setMode('remove'); setPreview(null); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                mode === 'remove'
                  ? 'bg-red-500/20 text-red-300 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Offer
            </button>
          </div>

          {/* Existing Offer Selection */}
          {mode === 'existing' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Select Offer
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-white/50 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading offers...
                </div>
              ) : offers.length === 0 ? (
                <p className="text-sm text-white/50 py-2">No offers available. Create one first.</p>
              ) : (
                <select
                  value={selectedOfferId}
                  onChange={(e) => { setSelectedOfferId(e.target.value); setPreview(null); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                >
                  <option value="" className="bg-[#0f1621]">Choose an offer...</option>
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id} className="bg-[#0f1621]">
                      {offer.name} (-{offer.discount_percentage}%)
                    </option>
                  ))}
                </select>
              )}
              {selectedOfferId && (
                <div className="p-3 bg-white/5 rounded-lg text-sm">
                  {(() => {
                    const offer = offers.find(o => o.id === Number(selectedOfferId))
                    if (!offer) return null
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/60">Discount:</span>
                          <span className="font-medium text-amber-300">-{offer.discount_percentage}%</span>
                        </div>
                        {offer.description && (
                          <p className="text-white/50 text-xs mt-1">{offer.description}</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Custom Discount Input */}
          {mode === 'custom' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Discount Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={customDiscount}
                  onChange={(e) => { setCustomDiscount(e.target.value); setPreview(null); }}
                  placeholder="e.g. 15"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">%</span>
              </div>
              <p className="text-xs text-white/40">
                Enter a discount between 1-99%. This will be applied to the calculated price.
              </p>
            </div>
          )}

          {/* Remove Mode Info */}
          {mode === 'remove' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-200">
                This will remove any special offer from the selected products and restore their regular prices.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview Panel */}
          {preview && (
            <div className={`p-4 rounded-xl space-y-3 ${
              preview.isRemove
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}>
              <div className={`flex items-center gap-2 font-medium ${
                preview.isRemove ? 'text-red-300' : 'text-emerald-300'
              }`}>
                <Check className="w-4 h-4" />
                Preview
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-black/20 rounded-lg">
                  <div className="text-white/50 text-xs">Products</div>
                  <div className="text-lg font-bold text-white">{preview.totalAffected}</div>
                </div>
                {!preview.isRemove && (
                  <div className="p-2 bg-black/20 rounded-lg">
                    <div className="text-white/50 text-xs">Discount</div>
                    <div className="text-lg font-bold text-amber-300">-{preview.discountPercentage}%</div>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/60">
                {preview.isRemove
                  ? `Removing special offers from ${preview.totalAffected} product(s)`
                  : `Applying "${preview.offerName}" to ${preview.totalAffected} product(s)`
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/5"
          >
            Cancel
          </button>

          {!preview ? (
            <button
              onClick={handlePreview}
              disabled={(mode === 'existing' && !selectedOfferId) || (mode === 'custom' && !customDiscount)}
              className={`px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                mode === 'remove'
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
            >
              Preview
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              className={`px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 ${
                preview.isRemove
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              {preview.isRemove
                ? `Remove from ${preview.totalAffected} Products`
                : `Apply to ${preview.totalAffected} Products`
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
