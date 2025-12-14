import React from 'react'
import { useDrillDown } from './DrillDownContext'

const tabs = [
  { label: 'Brands', view: 'brands' },
  { label: 'Types', view: 'product-types' },
  { label: 'Styles', view: 'styles' },
  { label: 'Variants', view: 'variants' },
  { label: 'All Products', view: 'all-products' },
]

export function ViewSwitcher() {
  const { currentView, navigateTo } = useDrillDown()

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-1">
      {tabs.map((tab) => (
        <button
          key={tab.view}
          onClick={() => navigateTo(tab.view, tab.label)}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            currentView === tab.view
              ? 'bg-emerald-500/20 text-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,0.25)]'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
