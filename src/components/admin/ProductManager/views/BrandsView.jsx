import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Building2, Loader2, Percent, Tag } from 'lucide-react'
import { useDrillDown } from '../DrillDownContext'

const API = '/.netlify/functions/products-admin/brands'

export function BrandsView() {
  const { navigateTo, searchQuery } = useDrillDown()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef(null)

  const fetchBrands = useCallback(async (nextCursor = null, reset = false) => {
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
      if (nextCursor) params.set('cursor', nextCursor)
      const res = await fetch(`${API}?${params}`)
      const result = await res.json()
      if (!res.ok || result.success === false) throw new Error(result.error || res.statusText)
      setData((prev) => (reset ? result.brands : [...prev, ...result.brands]))
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery])

  useEffect(() => { fetchBrands(null, true) }, [fetchBrands])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchBrands(cursor)
      }
    }, { threshold: 0.1 })
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loading, fetchBrands])

  if (loading && data.length === 0) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
  }

  return (
    <div className="p-4 space-y-3 h-full overflow-auto">
      {error && <div className="text-sm text-red-300">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((brand) => (
          <button
            key={brand.brand}
            onClick={() => navigateTo('product-types', { brand: brand.brand }, brand.brand)}
            className="text-left rounded-xl border border-white/10 bg-white/5 p-4 hover:border-purple-400/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-purple-500/20">
                <Building2 className="w-5 h-5 text-purple-300" />
              </span>
              <div>
                <div className="text-white font-semibold">{brand.brand}</div>
                <div className="text-xs text-white/60">{brand.variant_count} variants · {brand.style_count} styles</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-purple-300" />
                <span>{(brand.avg_margin ?? 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-300" />
                <span>{brand.special_offer_count || 0} offers</span>
              </div>
            </div>
            <div className="text-sm text-white/80 mt-2">
              £{(parseFloat(brand.avg_final_price ?? brand.avg_cost ?? '0') || 0).toFixed(2)} avg price
            </div>
          </button>
        ))}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="py-6 text-center text-white/60 text-sm">
          {loadingMore ? 'Loading more…' : 'Scroll to load more'}
        </div>
      )}
    </div>
  )
}

export default BrandsView
