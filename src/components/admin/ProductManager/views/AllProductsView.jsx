import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Plus, Loader2, Tag, Percent, Check, Minus, Edit2, Trash2, Image, Package } from 'lucide-react'
import { useDrillDown } from '../DrillDownContext'
import { ProductFormModal } from './Modals/ProductFormModal'

const API = '/.netlify/functions/products-admin'

export function AllProductsView() {
  const { searchQuery, activeBrand, activeProductType, activeStyleCode, toggleSkuSelection, selectedSkus } = useDrillDown()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [brandOptions, setBrandOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const loadMoreRef = useRef(null)

  const fetchProducts = useCallback(async (nextCursor = null, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setData([])
      } else {
        setLoadingMore(true)
      }
      setError(null)
      const params = new URLSearchParams({ limit: '50' })
      if (searchQuery) params.set('search', searchQuery)
      if (activeBrand) params.set('brand', activeBrand)
      if (activeProductType) params.set('productType', activeProductType)
      if (activeStyleCode) params.set('style_no', activeStyleCode)
      if (nextCursor) params.set('cursor', nextCursor)
      const res = await fetch(`${API}?${params}`)
      const result = await res.json()
      if (!res.ok || result.success === false) throw new Error(result.error || res.statusText)
      setData((prev) => (reset ? result.products : [...prev, ...result.products]))
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, activeBrand, activeProductType, activeStyleCode])

  const fetchBrandsAndCategories = useCallback(async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        fetch('/.netlify/functions/products-admin/brands-list'),
        fetch('/.netlify/functions/products-admin/categories-list')
      ])
      const brandsResult = await brandsRes.json()
      const categoriesResult = await categoriesRes.json()
      if (brandsResult.success !== false) setBrandOptions(brandsResult.brands || [])
      if (categoriesResult.success !== false) setCategoryOptions(categoriesResult.categories || [])
    } catch (err) {
      console.warn('Options load failed', err)
    }
  }, [])

  useEffect(() => { fetchProducts(null, true) }, [fetchProducts])
  useEffect(() => { fetchBrandsAndCategories() }, [fetchBrandsAndCategories])

  const brandLookup = useMemo(() => {
    const map = new Map()
    brandOptions.forEach((b) => map.set(b.id, b.name))
    return map
  }, [brandOptions])

  const brandChoicesFromData = useMemo(() => {
    const choices = new Map()
    data.forEach((p) => {
      if (p.brand_id) choices.set(p.brand_id, p.brand || `Brand #${p.brand_id}`)
    })
    return Array.from(choices.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

  const brandsForModal = brandOptions.length ? brandOptions : brandChoicesFromData

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchProducts(cursor)
    }, { threshold: 0.1 })
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loading, fetchProducts])

  if (loading && data.length === 0) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (sku) => {
    if (!window.confirm('Deactivate this product?')) return
    try {
      const res = await fetch(`${API}/${sku}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok || result.success === false) throw new Error(result.error || res.statusText)
      setData((prev) => prev.filter((p) => p.sku !== sku))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSaved = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    fetchProducts(null, true)
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {error && <div className="text-sm text-red-300">{error}</div>}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">All Products</h3>
        <button
          onClick={() => {
            setEditingProduct(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500"
        >
          <Plus className="w-4 h-4" /> New product
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-sm text-white/80">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-3 py-2 text-left w-10">Select</th>
              <th className="px-3 py-2 text-left w-16">Image</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-left">Type / Category</th>
              <th className="px-3 py-2 text-left">SKU / Style</th>
              <th className="px-3 py-2 text-right">Base</th>
              <th className="px-3 py-2 text-right">Margin</th>
              <th className="px-3 py-2 text-right">Final</th>
              <th className="px-3 py-2 text-left">Offer</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedSkus.includes(p.sku)}
                    onChange={() => toggleSkuSelection(p.sku)}
                    className="accent-emerald-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 border border-white/10 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    {p.name}
                    {p.is_multipack && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold whitespace-nowrap">
                        <Package className="w-3 h-3" />
                        {p.pack_quantity ? `×${p.pack_quantity}` : 'Pack'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">{p.brand || '—'}</td>
                <td className="px-3 py-2 text-white/70">
                  <div className="flex flex-col">
                    <span>{p.product_type || p.category || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-white/70">
                  <div className="flex flex-col gap-1">
                    {p.sku && <span className="text-xs text-white/60">SKU {p.sku}</span>}
                    {p.style_no && <span className="text-xs text-white/60">Style {p.style_no}</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">£{parseFloat(p.price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  {p.margin_percentage ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-emerald-200 text-xs">
                      <Percent className="w-3 h-3" /> +{p.margin_percentage}%
                    </span>
                  ) : (
                    <span className="text-white/40 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  £{parseFloat(p.final_price ?? p.calculated_price ?? p.price).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  {p.is_special_offer ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 text-xs">
                      <Tag className="w-3 h-3" /> -{p.offer_discount_percentage || 0}%
                    </span>
                  ) : (
                    <span className="text-white/40 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-white/70">
                  <div className="flex items-center gap-2">
                    {selectedSkus.includes(p.sku) ? <Check className="w-3 h-3 text-emerald-400" /> : <Minus className="w-3 h-3 text-white/40" />}
                    <span>{p.stock_quantity || 0}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.sku)}
                      className="p-1.5 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div ref={loadMoreRef} className="py-6 text-center text-white/60 text-sm">
            {loadingMore ? 'Loading more…' : 'Scroll to load more'}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProductFormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={editingProduct}
          brands={brandsForModal}
          categories={categoryOptions}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default AllProductsView
