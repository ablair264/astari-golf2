import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// View types for the drill-down hierarchy
export type ViewType = 'brands' | 'product-types' | 'styles' | 'variants' | 'all-products';

// Navigation path entry
export interface BreadcrumbEntry {
  view: ViewType;
  label: string;
  filter?: {
    brand?: string;
    productType?: string;
    styleCode?: string;
  };
}

// Context shape
interface DrillDownContextType {
  // Current view state
  currentView: ViewType;
  breadcrumbs: BreadcrumbEntry[];

  // Active filters from drill-down
  activeBrand: string | null;
  activeProductType: string | null;
  activeStyleCode: string | null;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Selection state for bulk operations
  selectedSkus: string[];
  setSelectedSkus: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSkuSelection: (sku: string) => void;
  selectAllSkus: (skus: string[]) => void;
  clearSelection: () => void;

  // Navigation methods
  navigateTo: (view: ViewType, filter?: { brand?: string; productType?: string; styleCode?: string }, label?: string) => void;
  navigateBack: () => void;
  navigateToBreadcrumb: (index: number) => void;
  resetNavigation: () => void;

  // View mode (entry point)
  viewMode: 'by-brand' | 'by-type' | 'by-style' | 'all';
  setViewMode: (mode: 'by-brand' | 'by-type' | 'by-style' | 'all') => void;
}

const DrillDownContext = createContext<DrillDownContextType | null>(null);

// Hook to use the context
export function useDrillDown() {
  const context = useContext(DrillDownContext);
  if (!context) {
    throw new Error('useDrillDown must be used within a DrillDownProvider');
  }
  return context;
}

// Provider component
interface DrillDownProviderProps {
  children: ReactNode;
}

export function DrillDownProvider({ children }: DrillDownProviderProps) {
  // View mode determines the starting view
  const [viewMode, setViewModeState] = useState<'by-brand' | 'by-type' | 'by-style' | 'all'>('by-brand');

  // Current view and navigation path
  const [currentView, setCurrentView] = useState<ViewType>('brands');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([
    { view: 'brands', label: 'All Brands' }
  ]);

  // Active filters from drill-down
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeProductType, setActiveProductType] = useState<string | null>(null);
  const [activeStyleCode, setActiveStyleCode] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);

  // Set view mode and reset navigation appropriately
  const setViewMode = useCallback((mode: 'by-brand' | 'by-type' | 'by-style' | 'all') => {
    setViewModeState(mode);
    setSelectedSkus([]);
    setSearchQuery('');
    setActiveBrand(null);
    setActiveProductType(null);
    setActiveStyleCode(null);

    switch (mode) {
      case 'by-brand':
        setCurrentView('brands');
        setBreadcrumbs([{ view: 'brands', label: 'All Brands' }]);
        break;
      case 'by-type':
        setCurrentView('product-types');
        setBreadcrumbs([{ view: 'product-types', label: 'All Product Types' }]);
        break;
      case 'by-style':
        setCurrentView('styles');
        setBreadcrumbs([{ view: 'styles', label: 'All Styles' }]);
        break;
      case 'all':
        setCurrentView('all-products');
        setBreadcrumbs([{ view: 'all-products', label: 'All Products' }]);
        break;
    }
  }, []);

  // Navigate to a specific view with optional filters
  const navigateTo = useCallback((
    view: ViewType,
    filter?: { brand?: string; productType?: string; styleCode?: string },
    label?: string
  ) => {
    // Update filters
    if (filter?.brand) setActiveBrand(filter.brand);
    if (filter?.productType) setActiveProductType(filter.productType);
    if (filter?.styleCode) setActiveStyleCode(filter.styleCode);

    // Create breadcrumb entry
    const breadcrumbLabel = label || view.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    const newEntry: BreadcrumbEntry = {
      view,
      label: breadcrumbLabel,
      filter: { ...filter },
    };

    setBreadcrumbs(prev => [...prev, newEntry]);
    setCurrentView(view);

    // Clear selection when navigating
    setSelectedSkus([]);
  }, []);

  // Navigate back one level
  const navigateBack = useCallback(() => {
    if (breadcrumbs.length <= 1) return;

    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    const targetEntry = newBreadcrumbs[newBreadcrumbs.length - 1];

    setBreadcrumbs(newBreadcrumbs);
    setCurrentView(targetEntry.view);

    // Update filters based on the target entry
    setActiveBrand(targetEntry.filter?.brand || null);
    setActiveProductType(targetEntry.filter?.productType || null);
    setActiveStyleCode(targetEntry.filter?.styleCode || null);

    // Clear selection when navigating
    setSelectedSkus([]);
  }, [breadcrumbs]);

  // Navigate to a specific breadcrumb
  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index < 0 || index >= breadcrumbs.length) return;

    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const targetEntry = newBreadcrumbs[newBreadcrumbs.length - 1];

    setBreadcrumbs(newBreadcrumbs);
    setCurrentView(targetEntry.view);

    // Update filters based on the target entry
    setActiveBrand(targetEntry.filter?.brand || null);
    setActiveProductType(targetEntry.filter?.productType || null);
    setActiveStyleCode(targetEntry.filter?.styleCode || null);

    // Clear selection when navigating
    setSelectedSkus([]);
  }, [breadcrumbs]);

  // Reset navigation to initial state
  const resetNavigation = useCallback(() => {
    setViewMode(viewMode);
  }, [viewMode, setViewMode]);

  // Selection helpers
  const toggleSkuSelection = useCallback((sku: string) => {
    setSelectedSkus(prev =>
      prev.includes(sku)
        ? prev.filter(s => s !== sku)
        : [...prev, sku]
    );
  }, []);

  const selectAllSkus = useCallback((skus: string[]) => {
    setSelectedSkus(skus);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSkus([]);
  }, []);

  const value: DrillDownContextType = {
    currentView,
    breadcrumbs,
    activeBrand,
    activeProductType,
    activeStyleCode,
    searchQuery,
    setSearchQuery,
    selectedSkus,
    setSelectedSkus,
    toggleSkuSelection,
    selectAllSkus,
    clearSelection,
    navigateTo,
    navigateBack,
    navigateToBreadcrumb,
    resetNavigation,
    viewMode,
    setViewMode,
  };

  return (
    <DrillDownContext.Provider value={value}>
      {children}
    </DrillDownContext.Provider>
  );
}

export default DrillDownContext;
