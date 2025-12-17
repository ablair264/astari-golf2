import { useState, useRef, useEffect } from 'react'
import { Package, AlertTriangle, ChevronUp, ChevronDown, History, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const StockBadge = ({ quantity, reorderPoint }) => {
  if (quantity === 0 || quantity === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
        Out of Stock
      </span>
    )
  }
  if (quantity <= reorderPoint) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
        <AlertTriangle className="w-3 h-3" />
        Low Stock
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
      In Stock
    </span>
  )
}

// Inline editable stock cell
const InlineStockEdit = ({ product, onSave }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(product.stock_quantity ?? 0)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setValue(product.stock_quantity ?? 0)
  }, [product.stock_quantity])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const newValue = parseInt(value) || 0
    if (newValue === product.stock_quantity) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    try {
      await onSave(product.id, newValue)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save:', err)
      setValue(product.stock_quantity ?? 0)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(product.stock_quantity ?? 0)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={saving}
          className="w-16 px-2 py-1 text-center text-lg font-bold bg-white/10 border border-emerald-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        {saving && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'px-3 py-1 rounded-lg text-lg font-bold transition-all hover:bg-white/10 hover:ring-2 hover:ring-white/20 cursor-text',
        product.stock_quantity === 0 ? 'text-red-400' :
        product.stock_quantity <= product.reorder_point ? 'text-amber-400' :
        'text-white'
      )}
      title="Click to edit"
    >
      {product.stock_quantity ?? 0}
    </button>
  )
}

const StockTable = ({
  products,
  selectedIds,
  onSelectionChange,
  onSort,
  sortBy,
  sortDir,
  onViewHistory,
  onStockUpdate,
  loading
}) => {
  const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id))
  const someSelected = products.some(p => selectedIds.includes(p.id))

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(products.map(p => p.id))
    }
  }

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const SortHeader = ({ column, children }) => {
    const isActive = sortBy === column
    return (
      <button
        onClick={() => onSort?.(column)}
        className={cn(
          'flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors',
          isActive ? 'text-emerald-400' : 'text-white/50 hover:text-white/70'
        )}
      >
        {children}
        <span className="flex flex-col">
          <ChevronUp className={cn('w-3 h-3 -mb-1', isActive && sortDir === 'asc' ? 'text-emerald-400' : 'text-white/30')} />
          <ChevronDown className={cn('w-3 h-3', isActive && sortDir === 'desc' ? 'text-emerald-400' : 'text-white/30')} />
        </span>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Package className="w-8 h-8 text-white/30" />
          <p className="text-white/50">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <Package className="w-8 h-8 text-white/30 mx-auto mb-3" />
        <p className="text-white/50">No products found</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Hint */}
      <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-white/40">
        Tip: Click on any stock number to edit it directly
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected && !allSelected)}
                  onChange={handleSelectAll}
                  className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                />
              </th>
              <th className="p-4 text-left">
                <SortHeader column="sku">SKU</SortHeader>
              </th>
              <th className="p-4 text-left">
                <SortHeader column="name">Product</SortHeader>
              </th>
              <th className="p-4 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Brand</span>
              </th>
              <th className="p-4 text-center">
                <SortHeader column="stock_quantity">Stock</SortHeader>
              </th>
              <th className="p-4 text-center">
                <SortHeader column="reorder_point">Reorder</SortHeader>
              </th>
              <th className="p-4 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Status</span>
              </th>
              <th className="p-4 text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr
                key={product.id}
                className={cn(
                  'hover:bg-white/5 transition-colors',
                  selectedIds.includes(product.id) && 'bg-emerald-500/10'
                )}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => handleSelect(product.id)}
                    className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                  />
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm text-white/80">{product.sku}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                    <span className="text-sm text-white font-medium truncate max-w-[200px]">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-white/60">{product.brand_name || '-'}</span>
                </td>
                <td className="p-4 text-center">
                  <InlineStockEdit product={product} onSave={onStockUpdate} />
                </td>
                <td className="p-4 text-center">
                  <span className="text-sm text-white/50">{product.reorder_point ?? 10}</span>
                </td>
                <td className="p-4">
                  <StockBadge quantity={product.stock_quantity} reorderPoint={product.reorder_point} />
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onViewHistory?.(product)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                    title="View History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StockTable
