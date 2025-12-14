import React, { useState } from 'react';
import { Search, Filter, RotateCcw, ChevronLeft, X, Settings2 } from 'lucide-react';
import { DrillDownProvider, useDrillDown } from './DrillDownContext';
import { ViewSwitcher } from './ViewSwitcher';
import { Breadcrumbs } from './Breadcrumbs';
import { RulesPanel } from '../RulesPanel/RulesPanel';
import { BulkActionBar } from '../BulkActionBar';

// Views
import { BrandsView } from '../views/BrandsView';
import { ProductTypesView } from '../views/ProductTypesView';
import { StylesView } from '../views/StylesView';
import { VariantsView } from '../views/VariantsView';
import { AllProductsView } from '../views/AllProductsView';

// Admin purple theme colors
const colors = {
  bgDark: '#1a1625',
  bgCard: '#2a2440',
  bgCardHover: '#3d3456',
  bgInput: '#1e1a2e',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  purple600: '#7c3aed',
  borderLight: 'rgba(139, 92, 246, 0.1)',
  borderMedium: 'rgba(139, 92, 246, 0.2)',
};

// Inner component that uses the context
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
  } = useDrillDown();

  const [isRulesPanelOpen, setIsRulesPanelOpen] = useState(true);

  // Render the appropriate view based on currentView
  const renderView = () => {
    switch (currentView) {
      case 'brands':
        return <BrandsView />;
      case 'product-types':
        return <ProductTypesView />;
      case 'styles':
        return <StylesView />;
      case 'variants':
        return <VariantsView />;
      case 'all-products':
        return <AllProductsView />;
      default:
        return <BrandsView />;
    }
  };

  const canGoBack = breadcrumbs.length > 1;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Left Panel - Rules & Filters */}
      <div
        className={`transition-all duration-300 flex-shrink-0 ${
          isRulesPanelOpen ? 'w-[380px]' : 'w-0 overflow-hidden'
        }`}
      >
        {isRulesPanelOpen && <RulesPanel onClose={() => setIsRulesPanelOpen(false)} />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="rounded-t-xl p-4 border-b"
          style={{
            background: colors.bgCard,
            borderColor: colors.borderLight,
          }}
        >
          {/* Top row: View Switcher + Actions */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {!isRulesPanelOpen && (
                <button
                  onClick={() => setIsRulesPanelOpen(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
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
                  className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1.5 rounded-lg"
                  style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                >
                  {selectedSkus.length} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-purple-500/10 transition-colors"
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
                  className="p-2 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors flex-shrink-0"
                  title="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <Breadcrumbs className="flex-1 min-w-0" />
            </div>

            {/* Search */}
            <div className="relative w-[300px] flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, name, brand..."
                className="w-full pl-10 pr-10 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                  fontFamily: "'Neuzeit Grotesk', sans-serif",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reset button */}
            <button
              onClick={resetNavigation}
              className="p-2 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors flex-shrink-0"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 rounded-b-xl overflow-hidden"
          style={{ background: colors.bgDark }}
        >
          {renderView()}
        </div>
      </div>

      {/* Bulk Action Bar - appears when items are selected */}
      <BulkActionBar />
    </div>
  );
}

// Main component with provider wrapper
export function ProductManagerLayout() {
  return (
    <DrillDownProvider>
      <ProductManagerContent />
    </DrillDownProvider>
  );
}

export default ProductManagerLayout;
