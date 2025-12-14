import React from 'react'
import { X, Trash2, Archive } from 'lucide-react'

export function BulkActionsModal({ open, onClose, onDelete, onArchive, onDuplicate, count }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold">Bulk actions</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm text-white/70">
          <p>{count} items selected.</p>
          <div className="space-y-2">
            <button
              onClick={onArchive}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
            >
              <Archive className="w-4 h-4" /> Archive
            </button>
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-200"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button
              onClick={onDuplicate}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
            >
              <Copy className="w-4 h-4" /> Duplicate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
