import React, { createContext, useContext, useState } from 'react'

const DrillDownContext = createContext(null)

export const DrillDownProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('brands')
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Brands', view: 'brands' }])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkus, setSelectedSkus] = useState([])

  const navigateTo = (view, label) => {
    setCurrentView(view)
    setBreadcrumbs((prev) => [...prev, { label, view }])
  }

  const navigateBack = () => {
    if (breadcrumbs.length > 1) {
      const newCrumbs = [...breadcrumbs]
      newCrumbs.pop()
      setBreadcrumbs(newCrumbs)
      setCurrentView(newCrumbs[newCrumbs.length - 1].view)
    }
  }

  const resetNavigation = () => {
    setBreadcrumbs([{ label: 'Brands', view: 'brands' }])
    setCurrentView('brands')
    setSelectedSkus([])
    setSearchQuery('')
  }

  const toggleSku = (sku) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    )
  }

  const clearSelection = () => setSelectedSkus([])

  return (
    <DrillDownContext.Provider
      value={{
        currentView,
        breadcrumbs,
        searchQuery,
        setSearchQuery,
        selectedSkus,
        toggleSku,
        clearSelection,
        navigateTo,
        navigateBack,
        resetNavigation,
      }}
    >
      {children}
    </DrillDownContext.Provider>
  )
}

export const useDrillDown = () => useContext(DrillDownContext)
