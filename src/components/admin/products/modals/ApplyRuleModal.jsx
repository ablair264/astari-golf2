import React from 'react'
import { X, Check } from 'lucide-react'

export default function ApplyRuleModal({ open, onClose, rule }) {
  if (!open || !rule) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold">Rule Applied</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <Check className="w-5 h-5 text-emerald-300 mt-0.5" />
            <div>
              <div className="font-semibold">{rule.name}</div>
              <div className="text-white/70 text-xs">Type: {rule.rule_type}</div>
              <div className="text-white/70 text-xs">+{rule.margin_percentage}%</div>
            </div>
          </div>
          <p className="text-sm text-white/70">Rule has been applied to matching products.</p>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
