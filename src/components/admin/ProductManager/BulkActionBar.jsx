import React, { useState } from 'react'
import { Trash2, Percent, Tag, X, Loader2 } from 'lucide-react'
import { useDrillDown } from './DrillDownContext'
import ApplyRuleModal from '../products/modals/ApplyRuleModal'
import SpecialOfferApplyModal from '../products/modals/SpecialOfferApplyModal'

export function BulkActionBar({ onRefresh }) {
  const { selectedSkus, clearSelection } = useDrillDown()
  const [showApplyRule, setShowApplyRule] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      // Delete each selected SKU
      const results = await Promise.allSettled(
        selectedSkus.map(sku =>
          fetch(`/.netlify/functions/products-admin/${sku}`, { method: 'DELETE' })
        )
      )
      const failed = results.filter(r => r.status === 'rejected').length
      if (failed > 0) {
        alert(`${failed} product(s) failed to delete`)
      }
      clearSelection()
      onRefresh?.()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete products')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSuccess = () => {
    clearSelection()
    onRefresh?.()
  }

  if (selectedSkus.length === 0) return null

  return (
    <>
      {/* Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 bg-[#111827]/95 border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-lg">
          {/* Selection Count */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-300">{selectedSkus.length}</span>
            </div>
            <span className="text-sm text-white/70">selected</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowApplyRule(true)}
              className="px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-purple-500/20 flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Percent className="w-4 h-4" />
              <span className="hidden sm:inline">Apply Margin</span>
            </button>

            <button
              onClick={() => setShowOffer(true)}
              className="px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-amber-500/20 flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Special Offer</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/20 flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>

          {/* Clear */}
          <button
            onClick={clearSelection}
            className="ml-1 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <ApplyRuleModal
        open={showApplyRule}
        onClose={() => setShowApplyRule(false)}
        selectedSkus={selectedSkus}
        onSuccess={handleSuccess}
      />

      <SpecialOfferApplyModal
        open={showOffer}
        onClose={() => setShowOffer(false)}
        selectedSkus={selectedSkus}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete Products</h3>
                  <p className="text-sm text-white/60">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-white/70">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-white">{selectedSkus.length}</span>{' '}
                product{selectedSkus.length > 1 ? 's' : ''}?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BulkActionBar
