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
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
  }

  return (
    <div className="p-4 space-y-3 h-full overflow-auto">
      {error && <div className="text-sm text-red-300">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((style) => (
          <div
            key={`${style.style_code}-${style.brand}`}
            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-purple-400/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-purple-500/20">
                <Shirt className="w-5 h-5 text-purple-300" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">{style.style_name || `Style ${style.style_code}`}</div>
                <div className="text-xs text-white/60">{style.brand} · {style.product_type}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditStyle({ style_no: style.style_code, name: style.style_name, brand: style.brand })
                  }}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit style"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateTo('variants', { styleCode: style.style_code, brand: style.brand, productType: style.product_type }, `Style ${style.style_code}`)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  title="View variants"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-purple-300" />
                <span>{(style.avg_margin ?? 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-300" />
                <span>{style.special_offer_count || 0} offers</span>
              </div>
              <div className="text-white/80">£{(style.min_final_price ?? style.min_cost ?? 0).toFixed(2)} - £{(style.max_final_price ?? style.max_cost ?? 0).toFixed(2)}</div>
            </div>
          </div>
        ))}
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
