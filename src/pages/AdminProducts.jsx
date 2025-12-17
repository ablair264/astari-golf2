import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Filter, Loader2, ChevronDown, ChevronUp, ChevronRight, RefreshCw, X, Plus, Pencil, Upload } from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'
import { ProductFormModal } from '@/components/admin/ProductManager/views/Modals/ProductFormModal'
import ProductUploadModal from '@/components/admin/ProductUploadModal'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = '/.netlify/functions/products-admin'

async function fetchJSON(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [styleNo, setStyleNo] = useState('')

  // Filter options
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [styles, setStyles] = useState([])

  // Sorting
  const [sortBy, setSortBy] = useState('style_no')
  const [sortDir, setSortDir] = useState('asc')

  // Pagination
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Expanded styles
  const [expandedStyles, setExpandedStyles] = useState(new Set())

  // Load filter options
  useEffect(() => {
    Promise.all([
      fetchJSON(`${API_BASE}/brands-list`),
      fetchJSON(`${API_BASE}/categories-list`),
      fetchJSON(`${API_BASE}/styles-list`),
    ]).then(([b, c, s]) => {
      setBrands(b.brands || [])
      setCategories(c.categories || [])
      setStyles(s.styles || [])
    }).catch(console.error)
  }, [])

  // Load products
  const loadProducts = useCallback(async (append = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('limit', '200') // Load more to group properly
      params.set('sortBy', sortBy)
      params.set('sortDir', sortDir)

      if (search.trim()) params.set('search', search.trim())
      if (brandId) params.set('brand_id', brandId)
      if (categoryId) params.set('category_id', categoryId)
      if (styleNo) params.set('style_no', styleNo)
      if (append && cursor) params.set('cursor', cursor)

      const data = await fetchJSON(`${API_BASE}/variants?${params}`)

      if (append) {
        setProducts(prev => [...prev, ...(data.variants || [])])
      } else {
        setProducts(data.variants || [])
      }
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Failed to load products', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, brandId, categoryId, styleNo, sortBy, sortDir, cursor])

  // Initial load and filter changes
  useEffect(() => {
    setCursor(null)
    loadProducts(false)
  }, [search, brandId, categoryId, styleNo, sortBy, sortDir])

  // Group products by style
  const groupedByStyle = useMemo(() => {
    const groups = {}

    products.forEach(product => {
      const key = product.style_no || `no-style-${product.id}`
      if (!groups[key]) {
        groups[key] = {
          style_no: product.style_no,
          name: product.name?.replace(/\s*-\s*(Black|White|Grey|Blue|Red|Green|Navy|Brown|Tan|Charcoal|Pink|Orange|Yellow|Purple).*$/i, '') || product.name,
          brand: product.brand,
          brand_id: product.brand_id,
          category: product.category,
          category_id: product.category_id,
          image_url: product.image_url,
          variants: []
        }
      }
      groups[key].variants.push(product)
    })

    // Calculate min/max price for each group
    Object.values(groups).forEach(group => {
      const prices = group.variants.map(v => parseFloat(v.final_price || v.calculated_price || v.price)).filter(p => !isNaN(p))
      group.price_min = prices.length ? Math.min(...prices) : null
      group.price_max = prices.length ? Math.max(...prices) : null
      group.variant_count = group.variants.length

      // Get first image from variants if group doesn't have one
      if (!group.image_url && group.variants[0]?.image_url) {
        group.image_url = group.variants[0].image_url
      }
    })

    return Object.values(groups).sort((a, b) => {
      if (!a.style_no && b.style_no) return 1
      if (a.style_no && !b.style_no) return -1
      if (!a.style_no && !b.style_no) return 0
      // Convert to string for comparison in case style_no is a number
      const aStyle = String(a.style_no)
      const bStyle = String(b.style_no)
      return sortDir === 'asc'
        ? aStyle.localeCompare(bStyle)
        : bStyle.localeCompare(aStyle)
    })
  }, [products, sortDir])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setBrandId('')
    setCategoryId('')
    setStyleNo('')
  }

  const hasFilters = search || brandId || categoryId || styleNo

  const handleEditVariant = (product) => {
    setEditProduct(product)
    setModalMode('variant')
    setShowModal(true)
  }

  const handleEditStyle = (style) => {
    // Edit the first variant with style mode
    setEditProduct(style.variants[0])
    setModalMode('style')
    setShowModal(true)
  }

  const handleAddVariant = (style) => {
    // Create new variant for this style
    setEditProduct({
      style_no: style.style_no,
      brand_id: style.brand_id,
      category_id: style.category_id,
      name: style.name,
    })
    setModalMode('create')
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditProduct(null)
    setModalMode('create')
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditProduct(null)
  }

  const handleSaved = () => {
    loadProducts(false)
  }

  const toggleStyleExpand = (styleNo) => {
    setExpandedStyles(prev => {
      const next = new Set(prev)
      if (next.has(styleNo)) {
        next.delete(styleNo)
      } else {
        next.add(styleNo)
      }
      return next
    })
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-'
    return `£${Number(price).toFixed(2)}`
  }

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null
    return sortDir === 'asc'
      ? <ChevronUp className="w-4 h-4 inline ml-1" />
      : <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] min-h-screen admin-body">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-1">Admin</p>
              <h1 className="text-2xl font-bold text-white admin-heading">Product Manager</h1>
              <p className="text-sm text-white/50 mt-1">
                {groupedByStyle.length} styles · {products.length} variants {hasMore && '(more available)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadProducts(false)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 transition-all"
              >
                <Upload className="w-4 h-4" /> Import Products
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-400 hover:to-emerald-600 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400/60"
              />
            </div>

            {/* Brand filter */}
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/60 cursor-pointer [&>option]:bg-[#0d121a] [&>option]:text-white"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Category filter */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/60 cursor-pointer [&>option]:bg-[#0d121a] [&>option]:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Style filter */}
            <select
              value={styleNo}
              onChange={(e) => setStyleNo(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/60 cursor-pointer [&>option]:bg-[#0d121a] [&>option]:text-white"
            >
              <option value="">All Styles</option>
              {styles.map((s) => (
                <option key={s.style_no} value={s.style_no}>
                  {s.style_no} - {s.style_name}
                </option>
              ))}
            </select>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/50">Active filters:</span>
              {search && (
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
                  Search: "{search}"
                </span>
              )}
              {brandId && (
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs">
                  Brand: {brands.find(b => b.id === Number(brandId))?.name}
                </span>
              )}
              {categoryId && (
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">
                  Category: {categories.find(c => c.id === Number(categoryId))?.name}
                </span>
              )}
              {styleNo && (
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs">
                  Style: {styleNo}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-2 px-2 py-1 rounded bg-white/10 text-white/60 text-xs hover:bg-white/20 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="w-10 px-2"></th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide cursor-pointer hover:text-white"
                      onClick={() => handleSort('style_no')}
                    >
                      Style <SortIcon column="style_no" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide cursor-pointer hover:text-white"
                      onClick={() => handleSort('name')}
                    >
                      Name <SortIcon column="name" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide cursor-pointer hover:text-white"
                      onClick={() => handleSort('brand')}
                    >
                      Brand <SortIcon column="brand" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide cursor-pointer hover:text-white"
                      onClick={() => handleSort('category')}
                    >
                      Category <SortIcon column="category" />
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Variants
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Price Range
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-white/40 mx-auto" />
                      </td>
                    </tr>
                  ) : groupedByStyle.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-white/50">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    groupedByStyle.map((style) => {
                      const isExpanded = expandedStyles.has(style.style_no || `no-style-${style.variants[0]?.id}`)
                      const styleKey = style.style_no || `no-style-${style.variants[0]?.id}`

                      return (
                        <React.Fragment key={styleKey}>
                          {/* Style Row */}
                          <tr
                            className={`border-b border-white/5 cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}
                            onClick={() => toggleStyleExpand(styleKey)}
                          >
                            <td className="px-2 py-3">
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="w-4 h-4 text-white/60" />
                              </motion.div>
                            </td>
                            <td className="px-4 py-3 font-mono text-emerald-300 font-medium">
                              {style.style_no || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {style.image_url && (
                                  <img
                                    src={style.image_url}
                                    alt={style.name}
                                    className="w-10 h-10 rounded object-cover bg-white/10"
                                  />
                                )}
                                <span className="text-white font-medium truncate max-w-[250px]">
                                  {style.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white/60">{style.brand || '-'}</td>
                            <td className="px-4 py-3 text-white/60">{style.category || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                                {style.variant_count} {style.variant_count === 1 ? 'variant' : 'variants'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-white font-medium">
                              {style.price_min === style.price_max
                                ? formatPrice(style.price_min)
                                : `${formatPrice(style.price_min)} - ${formatPrice(style.price_max)}`
                              }
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditStyle(style)}
                                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                  title="Edit style (all variants)"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleAddVariant(style)}
                                  className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                                  title="Add variant"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Variants */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={8} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-[#0a0e16] border-l-2 border-emerald-500/30 ml-6">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="bg-white/5">
                                            <th className="text-left px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide">SKU</th>
                                            <th className="text-left px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide">Colour</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide">Cost</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide">Margin</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide">Final Price</th>
                                            <th className="text-center px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide">Offer</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-white/50 uppercase tracking-wide w-20">Edit</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {style.variants.map((variant) => (
                                            <tr key={variant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                              <td className="px-4 py-2.5 font-mono text-white/70 text-xs">{variant.sku}</td>
                                              <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                  {variant.colour_hex && (
                                                    <span
                                                      className="w-4 h-4 rounded-full border border-white/20"
                                                      style={{ backgroundColor: variant.colour_hex }}
                                                    />
                                                  )}
                                                  <span className="text-white/60 text-xs">{variant.colour_name || '-'}</span>
                                                </div>
                                              </td>
                                              <td className="px-4 py-2.5 text-right text-white/50 text-xs">{formatPrice(variant.price)}</td>
                                              <td className="px-4 py-2.5 text-right">
                                                {variant.margin_percentage ? (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px]">
                                                    +{variant.margin_percentage}%
                                                  </span>
                                                ) : (
                                                  <span className="text-white/30 text-xs">-</span>
                                                )}
                                              </td>
                                              <td className="px-4 py-2.5 text-right text-white font-medium text-xs">
                                                {formatPrice(variant.final_price || variant.calculated_price || variant.price)}
                                              </td>
                                              <td className="px-4 py-2.5 text-center">
                                                {variant.is_special_offer ? (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10px]">
                                                    -{variant.offer_discount_percentage}%
                                                  </span>
                                                ) : (
                                                  <span className="text-white/30 text-xs">-</span>
                                                )}
                                              </td>
                                              <td className="px-4 py-2.5 text-right">
                                                <button
                                                  onClick={() => handleEditVariant(variant)}
                                                  className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                                  title="Edit variant"
                                                >
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => loadProducts(true)}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                ) : null}
                Load More
              </button>
            </div>
          )}
        </div>

        {/* Product Edit Modal */}
        <ProductFormModal
          open={showModal}
          onClose={handleModalClose}
          product={editProduct}
          brands={brands}
          categories={categories}
          mode={modalMode}
          onSaved={handleSaved}
        />

        {/* Product Upload Modal */}
        <ProductUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onImportComplete={() => {
            setShowUploadModal(false)
            loadProducts(false)
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
