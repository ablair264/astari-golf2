import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { Building2, ChevronRight, Loader2, Percent, Tag } from 'lucide-react';
import { useDrillDown } from '../ProductManager/DrillDownContext';
import { getAuthToken } from '../../../../lib/api';

// Admin purple theme colors
const colors = {
  bgDark: '#1a1625',
  bgCard: '#2a2440',
  bgCardHover: '#3d3456',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  borderLight: 'rgba(139, 92, 246, 0.1)',
  borderMedium: 'rgba(139, 92, 246, 0.2)',
};

const API_BASE = '/.netlify/functions';

interface BrandRow {
  brand: string;
  style_count: string;
  variant_count: string;
  avg_margin: string;
  avg_cost: string;
  avg_final_price: string;
  special_offer_count: string;
}

const columnHelper = createColumnHelper<BrandRow>();

export function BrandsView() {
  const token = getAuthToken();
  const { navigateTo, searchQuery } = useDrillDown();

  const [data, setData] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch brands
  const fetchBrands = useCallback(
    async (nextCursor?: string | null, reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setData([]);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params = new URLSearchParams({
          limit: '50',
          ...(searchQuery && { search: searchQuery }),
          ...(nextCursor && { cursor: nextCursor }),
        });

        const response = await fetch(`${API_BASE}/products-admin/brands?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (result.success) {
          setData((prev) => (reset ? result.brands : [...prev, ...result.brands]));
          setCursor(result.nextCursor);
          setHasMore(result.hasMore);
        } else {
          throw new Error(result.error || 'Failed to fetch brands');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, searchQuery]
  );

  // Initial load and search change
  useEffect(() => {
    fetchBrands(null, true);
  }, [fetchBrands]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchBrands(cursor);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, loading, fetchBrands]);

  // Handle row click - drill down to product types for this brand
  const handleRowClick = (brand: string) => {
    navigateTo('product-types', { brand }, brand);
  };

  // Table columns
  const columns: ColumnDef<BrandRow, any>[] = [
    columnHelper.accessor('brand', {
      header: 'Brand',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-medium text-white">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('style_count', {
      header: 'Styles',
      cell: (info) => (
        <span className="text-gray-300">{parseInt(info.getValue()).toLocaleString()}</span>
      ),
    }),
    columnHelper.accessor('variant_count', {
      header: 'Variants',
      cell: (info) => (
        <span className="text-gray-400">{parseInt(info.getValue()).toLocaleString()}</span>
      ),
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
    columnHelper.accessor('avg_cost', {
      header: 'Avg Cost',
      cell: (info) => (
        <span className="text-gray-400">£{parseFloat(info.getValue() || '0').toFixed(2)}</span>
      ),
    }),
    columnHelper.accessor('avg_final_price', {
      header: 'Avg Price',
      cell: (info) => (
        <span className="text-gray-300 font-medium">
          £{parseFloat(info.getValue() || '0').toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor('special_offer_count', {
      header: 'Offers',
      cell: (info) => {
        const count = parseInt(info.getValue() || '0');
        return count > 0 ? (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-green-400" />
            <span className="text-green-400">{count.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-gray-600">-</span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: () => (
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchBrands(null, true)}
          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 z-10" style={{ background: colors.bgCard }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  style={{
                    fontFamily: "'Neuzeit Grotesk', sans-serif",
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => handleRowClick(row.original.brand)}
              className="group cursor-pointer transition-colors hover:bg-purple-500/10"
              style={{ borderBottom: `1px solid ${colors.borderLight}` }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 text-sm"
                  style={{ fontFamily: "'Neuzeit Grotesk', sans-serif" }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {loadingMore && <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />}
        {!hasMore && data.length > 0 && (
          <span className="text-gray-500 text-sm">All {data.length} brands loaded</span>
        )}
      </div>
    </div>
  );
}

export default BrandsView;
