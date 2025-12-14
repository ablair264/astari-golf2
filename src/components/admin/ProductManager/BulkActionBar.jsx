import React from 'react'
import { Trash2, Copy, Archive } from 'lucide-react'
import { useDrillDown } from './DrillDownContext'

export function BulkActionBar() {
  const { selectedSkus, clearSelection } = useDrillDown()

  if (selectedSkus.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-3 bg-[#111827]/90 border border-white/10 rounded-full px-4 py-2 shadow-2xl backdrop-blur">
        <span className="text-sm text-white/80">{selectedSkus.length} selected</span>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-1">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          <button className="px-3 py-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-1">
            <Archive className="w-4 h-4" /> Archive
          </button>
          <button className="px-3 py-1.5 rounded-full text-red-300 hover:text-red-200 hover:bg-red-500/10 flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
        <button
          onClick={clearSelection}
          className="px-2 py-1 text-xs text-white/60 hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
