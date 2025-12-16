import React, { useState, useEffect } from 'react'
import { X, Loader2, ArrowRight, Check, AlertCircle, Percent, BookOpen } from 'lucide-react'

export default function ApplyRuleModal({ open, onClose, selectedSkus = [], onSuccess }) {
  const [mode, setMode] = useState('existing') // 'existing' | 'custom'
  const [rules, setRules] = useState([])
  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [customMargin, setCustomMargin] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  // Fetch available rules on open
  useEffect(() => {
    if (open) {
      setLoading(true)
      fetch('/.netlify/functions/margin-rules')
        .then(res => res.json())
        .then(data => {
          setRules(data.rules || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch rules:', err)
          setLoading(false)
        })
      // Reset state
      setMode('existing')
      setSelectedRuleId('')
      setCustomMargin('')
      setPreview(null)
      setError(null)
    }
  }, [open])

  const getMarginPercentage = () => {
    if (mode === 'custom') {
      return parseFloat(customMargin) || 0
    }
    const rule = rules.find(r => r.id === Number(selectedRuleId))
    return rule?.margin_percentage || 0
  }

  const handlePreview = async () => {
    const margin = getMarginPercentage()
    if (margin === 0 && mode === 'custom') {
      setError('Please enter a margin percentage')
      return
    }
    if (mode === 'existing' && !selectedRuleId) {
      setError('Please select a rule')
      return
    }

    setPreviewing(true)
    setError(null)

    try {
      // For bulk operations, we just show count and margin
      // In a real implementation, you might want to query the products
      setPreview({
        totalAffected: selectedSkus.length,
        marginPercentage: margin,
        ruleName: mode === 'existing' ? rules.find(r => r.id === Number(selectedRuleId))?.name : 'Custom Margin'
      })
    } catch (err) {
      setError('Failed to generate preview')
    } finally {
      setPreviewing(false)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/products-admin/bulk/margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skuCodes: selectedSkus,
          marginPercentage: getMarginPercentage()
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply margin')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to apply margin')
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
            <h3 className="text-lg font-semibold">Apply Margin Rule</h3>
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
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'existing'
                  ? 'bg-purple-500/20 text-purple-300 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Use Existing Rule
            </button>
            <button
              onClick={() => { setMode('custom'); setPreview(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'custom'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Percent className="w-4 h-4" />
              Custom Margin
            </button>
          </div>

          {/* Existing Rule Selection */}
          {mode === 'existing' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Select Rule
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-white/50 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading rules...
                </div>
              ) : (
                <select
                  value={selectedRuleId}
                  onChange={(e) => { setSelectedRuleId(e.target.value); setPreview(null); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                >
                  <option value="" className="bg-[#0f1621]">Choose a rule...</option>
                  {rules.map((rule) => (
                    <option key={rule.id} value={rule.id} className="bg-[#0f1621]">
                      {rule.name} (+{rule.margin_percentage}%)
                    </option>
                  ))}
                </select>
              )}
              {selectedRuleId && (
                <div className="p-3 bg-white/5 rounded-lg text-sm">
                  {(() => {
                    const rule = rules.find(r => r.id === Number(selectedRuleId))
                    if (!rule) return null
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/60">Margin:</span>
                          <span className="font-medium text-purple-300">+{rule.margin_percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Type:</span>
                          <span className="text-white/80 capitalize">{rule.rule_type?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Custom Margin Input */}
          {mode === 'custom' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Margin Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={customMargin}
                  onChange={(e) => { setCustomMargin(e.target.value); setPreview(null); }}
                  placeholder="e.g. 25"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">%</span>
              </div>
              <p className="text-xs text-white/40">
                Enter a value between 0-200%. This will be applied to the base price.
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
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <Check className="w-4 h-4" />
                Preview
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-black/20 rounded-lg">
                  <div className="text-white/50 text-xs">Products</div>
                  <div className="text-lg font-bold text-white">{preview.totalAffected}</div>
                </div>
                <div className="p-2 bg-black/20 rounded-lg">
                  <div className="text-white/50 text-xs">Margin</div>
                  <div className="text-lg font-bold text-emerald-300">+{preview.marginPercentage}%</div>
                </div>
              </div>
              <p className="text-xs text-white/60">
                Applying "{preview.ruleName}" to {preview.totalAffected} product(s)
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
              disabled={previewing || (mode === 'existing' && !selectedRuleId) || (mode === 'custom' && !customMargin)}
              className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {previewing && <Loader2 className="w-4 h-4 animate-spin" />}
              Preview Impact
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              Apply to {preview.totalAffected} Products
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
