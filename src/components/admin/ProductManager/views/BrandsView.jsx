import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Building2, Loader2, Percent, Tag, ChevronRight } from 'lucide-react'
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
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
  }

  return (
    <div className="p-4 h-full overflow-auto">
      {error && <div className="text-sm text-red-300 mb-3">{error}</div>}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Brand</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Variants</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Styles</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Margin</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Offers</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">Avg Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide w-20"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((brand) => (
              <tr
                key={brand.brand}
                onClick={() => navigateTo('product-types', { brand: brand.brand }, brand.brand)}
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20">
                      <Building2 className="w-4 h-4 text-emerald-300" />
                    </span>
                    <span className="text-white font-medium">{brand.brand}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-white/80">{brand.variant_count}</td>
                <td className="px-4 py-3 text-right text-white/80">{brand.style_count}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Percent className="w-3 h-3" />
                    {parseFloat(brand.avg_margin ?? 0).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Tag className="w-3 h-3" />
                    {brand.special_offer_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white/80">
                  £{(parseFloat(brand.avg_final_price ?? brand.avg_cost ?? '0') || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors ml-auto" />
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
    </div>
  )
}

export default BrandsView
