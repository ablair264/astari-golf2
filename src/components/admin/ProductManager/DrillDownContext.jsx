import React, { createContext, useContext, useState, useCallback } from 'react'

// View types for the drill-down hierarchy
export const VIEW_TYPES = ['brands', 'product-types', 'styles', 'variants', 'all-products']

const DrillDownContext = createContext(null)

export function useDrillDown() {
  const context = useContext(DrillDownContext)
  if (!context) {
    throw new Error('useDrillDown must be used within DrillDownProvider')
  }
  return context
}

export function DrillDownProvider({ children, pageMode = 'products' }) {
  // Page mode: 'products' for product management, 'margins' for margin/rule management
  // View mode determines the starting view
  const [viewMode, setViewModeState] = useState('by-brand') // 'by-brand' | 'by-type' | 'by-style' | 'all'

  // Current view and navigation path
  const [currentView, setCurrentView] = useState('brands')
  const [breadcrumbs, setBreadcrumbs] = useState([{ view: 'brands', label: 'All Brands' }])

  // Active filters from drill-down
  const [activeBrand, setActiveBrand] = useState(null)
  const [activeProductType, setActiveProductType] = useState(null)
  const [activeStyleCode, setActiveStyleCode] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Selection state
  const [selectedSkus, setSelectedSkus] = useState([])

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode)
    setSelectedSkus([])
    setSearchQuery('')
    setActiveBrand(null)
    setActiveProductType(null)
    setActiveStyleCode(null)

    switch (mode) {
      case 'by-brand':
        setCurrentView('brands')
        setBreadcrumbs([{ view: 'brands', label: 'All Brands' }])
        break
      case 'by-type':
        setCurrentView('product-types')
        setBreadcrumbs([{ view: 'product-types', label: 'All Product Types' }])
        break
      case 'by-style':
        setCurrentView('styles')
        setBreadcrumbs([{ view: 'styles', label: 'All Styles' }])
        break
      case 'all':
        setCurrentView('all-products')
        setBreadcrumbs([{ view: 'all-products', label: 'All Products' }])
        break
      default:
        break
    }
  }, [])

  // Navigate to a specific view with optional filters
  const navigateTo = useCallback((view, filter = {}, label) => {
    if (filter.brand) setActiveBrand(filter.brand)
    if (filter.productType) setActiveProductType(filter.productType)
    if (filter.styleCode) setActiveStyleCode(filter.styleCode)

    const breadcrumbLabel = label || view.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const newEntry = { view, label: breadcrumbLabel, filter: { ...filter } }

    setBreadcrumbs((prev) => [...prev, newEntry])
    setCurrentView(view)
    setSelectedSkus([])
  }, [])

  const navigateBack = useCallback(() => {
    setBreadcrumbs((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.slice(0, -1)
      const target = next[next.length - 1]
      setCurrentView(target.view)
      setActiveBrand(target.filter?.brand || null)
      setActiveProductType(target.filter?.productType || null)
      setActiveStyleCode(target.filter?.styleCode || null)
      setSelectedSkus([])
      return next
    })
  }, [])

  const navigateToBreadcrumb = useCallback((index) => {
    setBreadcrumbs((prev) => {
      if (index < 0 || index >= prev.length) return prev
      const next = prev.slice(0, index + 1)
      const target = next[next.length - 1]
      setCurrentView(target.view)
      setActiveBrand(target.filter?.brand || null)
      setActiveProductType(target.filter?.productType || null)
      setActiveStyleCode(target.filter?.styleCode || null)
      setSelectedSkus([])
      return next
    })
  }, [])

  const resetNavigation = useCallback(() => {
    setViewMode(viewMode)
  }, [viewMode, setViewMode])

  const toggleSkuSelection = useCallback((sku) => {
    setSelectedSkus((prev) => (prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]))
  }, [])

  const selectAllSkus = useCallback((skus) => {
    setSelectedSkus(skus)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedSkus([])
  }, [])

  const value = {
    pageMode,
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
  }

  return <DrillDownContext.Provider value={value}>{children}</DrillDownContext.Provider>
}

export default DrillDownContext
