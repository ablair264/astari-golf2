import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { Package, Loader2, Percent, Tag, Check, Minus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useDrillDown } from '../ProductManager/DrillDownContext';
import { getAuthToken } from '../../../../lib/api';

const colors = {
  bgDark: '#1a1625',
  bgCard: '#2a2440',
  bgCardHover: '#3d3456',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  borderLight: 'rgba(139, 92, 246, 0.1)',
};

const API_BASE = '/.netlify/functions';

interface ProductRow {
  id: string;
  sku_code: string;
  style_code: string;
  style_name: string;
  brand: string;
  product_type: string;
  colour_code: string;
  colour_name: string;
  size_code: string;
  size_name: string;
  single_price: string;
  margin_percentage: string;
  calculated_price: string;
  final_price: string;
  is_special_offer: boolean;
  offer_discount_percentage: string | null;
  primary_product_image_url: string | null;
  sku_status: string;
}

const columnHelper = createColumnHelper<ProductRow>();

type SortColumn = 'sku_code' | 'style_name' | 'brand' | 'product_type' | 'single_price' | 'final_price' | 'margin_percentage';
type SortDir = 'asc' | 'desc';

export function AllProductsView() {
  const token = getAuthToken();
  const { searchQuery, selectedSkus, toggleSkuSelection, selectAllSkus } = useDrillDown();

  const [data, setData] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState<SortColumn>('sku_code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(
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
          sortBy,
          sortDir,
          ...(searchQuery && { search: searchQuery }),
          ...(nextCursor && { cursor: nextCursor }),
        });

        const response = await fetch(`${API_BASE}/products-admin/all?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (result.success) {
          setData((prev) => (reset ? result.products : [...prev, ...result.products]));
          setCursor(result.nextCursor);
          setHasMore(result.hasMore);
          setTotal(result.total);
        } else {
          throw new Error(result.error || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, searchQuery, sortBy, sortDir]
  );

  useEffect(() => {
    fetchProducts(null, true);
  }, [fetchProducts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProducts(cursor);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, loading, fetchProducts]);

  // Handle sort column click
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  // Render sort indicator
  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-purple-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-purple-400" />
    );
  };

  // Selection handling
  const allSelected = data.length > 0 && data.every((row) => selectedSkus.includes(row.sku_code));
  const someSelected = data.some((row) => selectedSkus.includes(row.sku_code));

  const handleSelectAll = () => {
    if (allSelected) {
      const visibleSkus = data.map((row) => row.sku_code);
      const newSelected = selectedSkus.filter((sku) => !visibleSkus.includes(sku));
      selectAllSkus(newSelected);
    } else {
      const visibleSkus = data.map((row) => row.sku_code);
      const newSelected = Array.from(new Set([...selectedSkus, ...visibleSkus]));
      selectAllSkus(newSelected);
    }
  };

  const columns: ColumnDef<ProductRow, any>[] = [
    columnHelper.display({
      id: 'select',
      header: () => (
        <button
          onClick={handleSelectAll}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
            allSelected
              ? 'bg-purple-500 border-purple-500'
              : someSelected
              ? 'bg-purple-500/50 border-purple-500'
              : 'border-gray-600 hover:border-purple-400'
          }`}
        >
          {allSelected ? (
            <Check className="w-3 h-3 text-white" />
          ) : someSelected ? (
            <Minus className="w-3 h-3 text-white" />
          ) : null}
        </button>
      ),
      cell: (info) => {
        const isSelected = selectedSkus.includes(info.row.original.sku_code);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSkuSelection(info.row.original.sku_code);
            }}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-purple-500 border-purple-500'
                : 'border-gray-600 hover:border-purple-400'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </button>
        );
      },
    }),
    columnHelper.accessor('sku_code', {
      header: () => (
        <button
          onClick={() => handleSort('sku_code')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          SKU <SortIndicator column="sku_code" />
        </button>
      ),
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            {row.primary_product_image_url ? (
              <img
                src={row.primary_product_image_url}
                alt={row.style_name}
                className="w-10 h-10 rounded-lg object-cover bg-gray-700"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
            )}
            <span className="font-mono text-xs text-white">{info.getValue()}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('style_name', {
      header: () => (
        <button
          onClick={() => handleSort('style_name')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          Product <SortIndicator column="style_name" />
        </button>
      ),
      cell: (info) => (
        <span className="text-gray-300 truncate max-w-[200px] block">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('brand', {
      header: () => (
        <button
          onClick={() => handleSort('brand')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          Brand <SortIndicator column="brand" />
        </button>
      ),
      cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('product_type', {
      header: () => (
        <button
          onClick={() => handleSort('product_type')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          Type <SortIndicator column="product_type" />
        </button>
      ),
      cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'variant',
      header: 'Variant',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="text-xs">
            <span className="text-gray-400">{row.colour_name}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-gray-400">{row.size_name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('single_price', {
      header: () => (
        <button
          onClick={() => handleSort('single_price')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          Cost <SortIndicator column="single_price" />
        </button>
      ),
      cell: (info) => (
        <span className="text-gray-400">£{parseFloat(info.getValue() || '0').toFixed(2)}</span>
      ),
    }),
    columnHelper.accessor('margin_percentage', {
      header: () => (
        <button
          onClick={() => handleSort('margin_percentage')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          Margin <SortIndicator column="margin_percentage" />
        </button>
      ),
      cell: (info) => (
        <div className="flex items-center gap-1">
          <Percent className="w-3 h-3 text-purple-400" />
          <span className="text-purple-300">{parseFloat(info.getValue() || '0').toFixed(1)}%</span>
        </div>
      ),
    }),
    columnHelper.accessor('final_price', {
      header: () => (
        <button
          onClick={() => handleSort('final_price')}
          className="flex items-center gap-1 hover:text-purple-300"
        >
          Price <SortIndicator column="final_price" />
        </button>
      ),
      cell: (info) => {
        const row = info.row.original;
        const finalPrice = parseFloat(info.getValue() || '0');
        const calcPrice = parseFloat(row.calculated_price || '0');
        const isDiscounted = row.is_special_offer && finalPrice < calcPrice;

        return (
          <div className="flex items-center gap-2">
            {isDiscounted && (
              <span className="text-gray-500 line-through text-xs">£{calcPrice.toFixed(2)}</span>
            )}
            <span className={`font-medium ${isDiscounted ? 'text-green-400' : 'text-white'}`}>
              £{finalPrice.toFixed(2)}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('is_special_offer', {
      header: 'Offer',
      cell: (info) => {
        const row = info.row.original;
        if (info.getValue()) {
          return (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs">
                -{parseFloat(row.offer_discount_percentage || '0').toFixed(0)}%
              </span>
            </div>
          );
        }
        return <span className="text-gray-600">-</span>;
      },
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
          onClick={() => fetchProducts(null, true)}
          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header with count */}
      <div
        className="sticky top-0 z-10 px-4 py-2 text-xs text-gray-500"
        style={{ background: colors.bgCard, borderBottom: `1px solid ${colors.borderLight}` }}
      >
        Showing {data.length.toLocaleString()} of {total.toLocaleString()} products
      </div>

      <table className="w-full">
        <thead className="sticky top-8 z-10" style={{ background: colors.bgCard }}>
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
          {table.getRowModel().rows.map((row) => {
            const isSelected = selectedSkus.includes(row.original.sku_code);
            return (
              <tr
                key={row.id}
                className={`transition-colors ${
                  isSelected ? 'bg-purple-500/20' : 'hover:bg-purple-500/5'
                }`}
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
            );
          })}
        </tbody>
      </table>

      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {loadingMore && <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />}
        {!hasMore && data.length > 0 && (
          <span className="text-gray-500 text-sm">All {data.length} products loaded</span>
        )}
      </div>
    </div>
  );
}

export default AllProductsView;
