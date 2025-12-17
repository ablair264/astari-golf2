import React from 'react'
import { Building2, Layers, Shirt, Grid3X3 } from 'lucide-react'
import { useDrillDown } from './DrillDownContext'

const viewModes = [
  { id: 'by-brand', label: 'By Brand', icon: Building2, description: 'Brand → Types → Styles → SKUs' },
  { id: 'by-type', label: 'By Type', icon: Layers, description: 'Type → Styles → SKUs' },
  { id: 'by-style', label: 'By Style', icon: Shirt, description: 'Style → SKUs' },
  { id: 'all', label: 'All Products', icon: Grid3X3, description: 'Flat list of all SKUs' },
]

export function ViewSwitcher({ className = '' }) {
  const { viewMode, setViewMode } = useDrillDown()

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {viewModes.map((mode) => {
        const Icon = mode.icon
        const isActive = viewMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'bg-[#2a2440] text-gray-400 border border-transparent hover:bg-[#3d3456] hover:text-gray-200 hover:border-emerald-500/20'
            }`}
            style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
            title={mode.description}
          >
            <Icon
              className={`w-4 h-4 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'
              }`}
            />
            <span className="text-sm font-medium">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function ViewSwitcherCompact({ className = '' }) {
  const { viewMode, setViewMode } = useDrillDown()
  return (
    <div className={`inline-flex rounded-lg border border-emerald-500/20 overflow-hidden ${className}`} style={{ background: '#2a2440' }}>
      {viewModes.map((mode, index) => {
        const Icon = mode.icon
        const isActive = viewMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`p-2.5 transition-all duration-200 ${index > 0 ? 'border-l border-emerald-500/20' : ''} ${
              isActive ? 'bg-emerald-500/30 text-emerald-300' : 'text-gray-500 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
            title={`${mode.label}: ${mode.description}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}

export default ViewSwitcher
