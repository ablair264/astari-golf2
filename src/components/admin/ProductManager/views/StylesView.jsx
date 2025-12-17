import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Shirt, Loader2, Percent, Tag, ChevronRight, Edit2 } from 'lucide-react'
import { useDrillDown } from '../DrillDownContext'
import { ProductFormModal } from './Modals/ProductFormModal'

const API = '/.netlify/functions/products-admin/styles'

export function StylesView() {
  const { navigateTo, searchQuery, activeBrand, activeProductType } = useDrillDown()
  const [editStyle, setEditStyle] = useState(null)
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

  const fetchStyles = useCallback(async (nextCursor = null, reset = false) => {
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
      if (nextCursor) params.set('cursor', nextCursor)
      const res = await fetch(`${API}?${params}`)
      const result = await res.json()
      if (!res.ok || result.success === false) throw new Error(result.error || res.statusText)
      setData((prev) => (reset ? result.styles : [...prev, ...result.styles]))
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, activeBrand, activeProductType])

  useEffect(() => { fetchStyles(null, true) }, [fetchStyles])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchStyles(cursor)
    }, { threshold: 0.1 })
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loading, fetchStyles])

  if (loading && data.length === 0) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
  }

  return (
    <div className="p-4 h-full overflow-auto">
      {error && <div className="text-sm text-red-300 mb-3">{error}</div>}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Style</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Brand</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Margin</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Offers</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Price Range</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((style) => (
              <tr
                key={`${style.style_code}-${style.brand}`}
                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20">
                      <Shirt className="w-4 h-4 text-emerald-300" />
                    </span>
                    <div>
                      <div className="text-white font-medium">{style.style_name || `Style ${style.style_code}`}</div>
                      <div className="text-xs text-white/50">{style.style_code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/80">{style.brand}</td>
                <td className="px-4 py-3 text-white/80">{style.product_type}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Percent className="w-3 h-3" />
                    {parseFloat(style.avg_margin ?? 0).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Tag className="w-3 h-3" />
                    {style.special_offer_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white/80">
                  £{parseFloat(style.min_final_price ?? style.min_cost ?? 0).toFixed(2)} - £{parseFloat(style.max_final_price ?? style.max_cost ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditStyle({ style_no: style.style_code, name: style.style_name, brand: style.brand })
                      }}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Edit style"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateTo('variants', { styleCode: style.style_code, brand: style.brand, productType: style.product_type }, `Style ${style.style_code}`)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      title="View variants"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="py-6 text-center text-white/60 text-sm">
          {loadingMore ? 'Loading more…' : 'Scroll to load more'}
        </div>
      )}

      {/* Edit Style Modal */}
      <ProductFormModal
        open={!!editStyle}
        onClose={() => setEditStyle(null)}
        product={editStyle}
        brands={brands}
        categories={categories}
        mode="style"
        onSaved={() => {
          setEditStyle(null)
          fetchStyles(null, true)
        }}
      />
    </div>
  )
}

export default StylesView
