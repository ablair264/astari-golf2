import React, { useState } from 'react'
import { Search, Filter, RotateCcw, ChevronLeft, X, Settings2 } from 'lucide-react'
import { DrillDownProvider, useDrillDown } from './DrillDownContext'
import { ViewSwitcher } from './ViewSwitcher'
import { Breadcrumbs } from './Breadcrumbs'
import { RulesPanel } from './RulesPanel'
import { BulkActionBar } from './BulkActionBar'

// Views
import { BrandsView } from './views/BrandsView'
import { ProductTypesView } from './views/ProductTypesView'
import { StylesView } from './views/StylesView'
import { VariantsView } from './views/VariantsView'
import { AllProductsView } from './views/AllProductsView'

// ASTARI theme
const colors = {
  bgDark: '#0d121a',
  bgCard: 'rgba(17, 24, 39, 0.8)',
  bgCardHover: 'rgba(24, 32, 44, 0.9)',
  bgInput: 'rgba(255, 255, 255, 0.04)',
  accent: '#78BE20',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderMedium: 'rgba(255, 255, 255, 0.12)',
}

function ProductManagerContent() {
  const {
    currentView,
    breadcrumbs,
    searchQuery,
    setSearchQuery,
    selectedSkus,
    clearSelection,
    navigateBack,
    resetNavigation,
  } = useDrillDown()

  const [isRulesPanelOpen, setIsRulesPanelOpen] = useState(true)

  const renderView = () => {
    switch (currentView) {
      case 'brands':
        return <BrandsView />
      case 'product-types':
        return <ProductTypesView />
      case 'styles':
        return <StylesView />
      case 'variants':
        return <VariantsView />
      case 'all-products':
        return <AllProductsView />
      default:
        return <BrandsView />
    }
  }

  const canGoBack = breadcrumbs.length > 1

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 text-white overflow-hidden" style={{ fontFamily: 'Gravesend Sans, sans-serif' }}>
      {/* Left Panel - Rules & Filters */}
      <div
        className={`transition-all duration-300 flex-shrink-0 ${
          isRulesPanelOpen ? 'w-[360px]' : 'w-0 overflow-hidden'
        }`}
      >
        {isRulesPanelOpen && <RulesPanel onClose={() => setIsRulesPanelOpen(false)} />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div
          className="rounded-t-xl p-4 border-b"
          style={{
            background: colors.bgCard,
            borderColor: colors.borderLight,
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Top row: View Switcher + Actions */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {!isRulesPanelOpen && (
                <button
                  onClick={() => setIsRulesPanelOpen(true)}
                  className="p-2 rounded-lg text-gray-300 hover:text-emerald-200 hover:bg-white/5 transition-colors"
                  title="Show Rules Panel"
                >
                  <Settings2 className="w-5 h-5" />
                </button>
              )}
              <ViewSwitcher />
            </div>

            {/* Selection indicator */}
            {selectedSkus.length > 0 && (
              <div className="flex items-center gap-3">
                <span
                  className="text-sm text-emerald-200 bg-emerald-500/15 px-3 py-1.5 rounded-lg"
                >
                  {selectedSkus.length} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Second row: Breadcrumbs + Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {canGoBack && (
                <button
                  onClick={navigateBack}
                  className="p-2 rounded-lg text-gray-300 hover:text-emerald-200 hover:bg-white/5 transition-colors flex-shrink-0"
                  title="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <Breadcrumbs className="flex-1 min-w-0" />
            </div>

            {/* Search */}
            <div className="relative w-[300px] flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, name, brand..."
                className="w-full pl-10 pr-10 py-2 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reset button */}
            <button
              onClick={resetNavigation}
              className="p-2 rounded-lg text-gray-300 hover:text-emerald-200 hover:bg-white/5 transition-colors flex-shrink-0"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 rounded-b-xl overflow-y-auto"
          style={{ background: colors.bgDark }}
        >
          {renderView()}
        </div>
      </div>

      {/* Bulk Action Bar - appears when items are selected */}
      <BulkActionBar />
    </div>
  )
}

export function ProductManagerLayout() {
  return (
    <DrillDownProvider>
      <ProductManagerContent />
    </DrillDownProvider>
  )
}

export default ProductManagerLayout
