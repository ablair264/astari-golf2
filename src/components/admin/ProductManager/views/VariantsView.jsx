import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useDrillDown } from '../DrillDownContext'
import { Check, Minus, Edit2, Package } from 'lucide-react'
import { ProductFormModal } from './Modals/ProductFormModal'

const API = '/.netlify/functions/products-admin/variants'

export function VariantsView() {
  const { toggleSkuSelection, selectedSkus, activeBrand, activeProductType, activeStyleCode, searchQuery } = useDrillDown()
  const [editVariant, setEditVariant] = useState(null)
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])

  // Fetch brands and categories for the form
  useEffect(() => {
    Promise.all([
      fetch('/.netlify/functions/products-admin/brands-list').then(r => r.json()),
      fetch('/.netlify/functions/products-admin/categories-list').then(r => r.json())
    ]).then(([brandsData, categoriesData]) => {
      setBrands(brandsData.brands || [])
      setCategories(categoriesData.categories || [])
    }).catch(console.error)
  }, [])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef(null)

  const fetchVariants = useCallback(async (nextCursor = null, reset = false) => {
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
      setData((prev) => (reset ? result.variants : [...prev, ...result.variants]))
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, activeBrand, activeProductType, activeStyleCode])

  useEffect(() => { fetchVariants(null, true) }, [fetchVariants])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchVariants(cursor)
    }, { threshold: 0.1 })
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loading, fetchVariants])

  if (loading && data.length === 0) {
    return <div className="flex items-center justify-center h-full text-white/60">Loading variants…</div>
  }

  return (
    <div className="p-4 space-y-3 h-full overflow-auto">
      {error && <div className="text-sm text-red-300">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((variant) => (
          <div key={variant.id} className={`p-4 rounded-xl border transition-all group ${selectedSkus.includes(variant.sku) ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedSkus.includes(variant.sku)}
                onChange={() => toggleSkuSelection(variant.sku)}
                className="accent-emerald-500 mt-1 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-[0.12em]">
                  <span>{variant.brand}</span>
                  {variant.style_no && <span className="text-white/40">Style {variant.style_no}</span>}
                  {variant.is_multipack && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold">
                      <Package className="w-3 h-3" />
                      {variant.pack_quantity ? `×${variant.pack_quantity}` : 'Pack'}
                    </span>
                  )}
                </div>
                <h4 className="text-white font-semibold truncate">{variant.name}</h4>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="inline-flex h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: variant.colour_hex || '#e5e7eb' }} />
                  <span className="capitalize">{variant.colour_name}</span>
                  {variant.sku && <span className="text-white/40">SKU {variant.sku}</span>}
                </div>
                <div className="flex flex-col gap-1 text-sm text-white mt-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-white/70 text-xs uppercase tracking-[0.12em]">With margin</span>
                    <span>£{parseFloat(variant.final_price ?? variant.calculated_price ?? variant.price).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-white/60">Base £{parseFloat(variant.price).toFixed(2)}{variant.margin_percentage ? ` · +${variant.margin_percentage}%` : ''}</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditVariant(variant)
                }}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="Edit variant"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="py-6 text-center text-white/60 text-sm">
          {loadingMore ? 'Loading more…' : 'Scroll to load more'}
        </div>
      )}

      {/* Edit Variant Modal */}
      <ProductFormModal
        open={!!editVariant}
        onClose={() => setEditVariant(null)}
        product={editVariant}
        brands={brands}
        categories={categories}
        mode="variant"
        onSaved={() => {
          setEditVariant(null)
          fetchVariants(null, true)
        }}
      />
    </div>
  )
}

export default VariantsView
