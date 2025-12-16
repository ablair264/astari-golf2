import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Layers, ChevronRight, Loader2, Percent, Tag } from 'lucide-react'
import { useDrillDown } from '../DrillDownContext'

const API_BASE = '/.netlify/functions'

const columnHelper = createColumnHelper()

export function ProductTypesView() {
  const { navigateTo, searchQuery, activeBrand } = useDrillDown()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  const loadMoreRef = useRef(null)

  const fetchProductTypes = useCallback(
    async (nextCursor = null, reset = false) => {
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
        if (nextCursor) params.set('cursor', nextCursor)

        const res = await fetch(`${API_BASE}/products-admin/product-types?${params}`)
        const result = await res.json()
        if (result.success) {
          setData((prev) => (reset ? result.productTypes : [...prev, ...result.productTypes]))
          setCursor(result.nextCursor)
          setHasMore(result.hasMore)
        } else {
          throw new Error(result.error || 'Failed to fetch product types')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchQuery, activeBrand]
  )

  useEffect(() => {
    fetchProductTypes(null, true)
  }, [fetchProductTypes])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProductTypes(cursor)
        }
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loading, fetchProductTypes])

  const handleRowClick = (productType) => {
    navigateTo('styles', { productType, brand: activeBrand || undefined }, productType)
  }

  const columns = [
    columnHelper.accessor('product_type', {
      header: 'Product Type',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-medium text-white">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('style_count', {
      header: 'Styles',
      cell: (info) => <span className="text-gray-300">{parseInt(info.getValue() || '0')}</span>,
    }),
    columnHelper.accessor('variant_count', {
      header: 'Variants',
      cell: (info) => <span className="text-gray-400">{parseInt(info.getValue() || '0')}</span>,
    }),
    columnHelper.accessor('avg_margin', {
      header: 'Avg Margin',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <Percent className="w-3 h-3 text-purple-400" />
          <span className="text-purple-300">{parseFloat(info.getValue() || '0').toFixed(1)}%</span>
        </div>
      ),
    }),
    columnHelper.accessor('avg_final_price', {
      header: 'Avg Price',
      cell: (info) => <span className="text-gray-300 font-medium">£{parseFloat(info.getValue() || '0').toFixed(2)}</span>,
    }),
    columnHelper.accessor('special_offer_count', {
      header: 'Offers',
      cell: (info) => {
        const count = parseInt(info.getValue() || '0')
        return count > 0 ? (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-green-400" />
            <span className="text-green-400">{count}</span>
          </div>
        ) : (
          <span className="text-gray-600">-</span>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: () => <ChevronRight className="w-4 h-4 text-gray-500" />,
    }),
  ]

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {error && <div className="text-sm text-red-300 px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="text-left px-4 py-2 font-medium border-b border-white/10">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-white/5 cursor-pointer"
                onClick={() => handleRowClick(row.original.product_type)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-white/80">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
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
    </div>
  )
}

export default ProductTypesView
