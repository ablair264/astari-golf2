import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, Download, RefreshCw, Package, Plus } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import InventoryStats from '@/components/admin/inventory/InventoryStats'
import StockTable from '@/components/admin/inventory/StockTable'
import StockAdjustmentModal from '@/components/admin/inventory/StockAdjustmentModal'
import StockHistoryModal from '@/components/admin/inventory/StockHistoryModal'

const API_BASE = '/.netlify/functions/inventory-admin'

const AdminInventory = () => {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [sortBy, setSortBy] = useState('stock_quantity')
  const [sortDir, setSortDir] = useState('asc')

  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Load data
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('sortBy', sortBy)
      params.set('sortDir', sortDir)
      params.set('limit', '100')

      const res = await fetch(`${API_BASE}?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, sortDir])

  useEffect(() => {
    loadStats()
    loadProducts()
  }, [loadStats, loadProducts])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  const handleFilterChange = (status) => {
    setStatusFilter(status)
    setSelectedIds([])
  }

  const handleAdjust = async (adjustmentData) => {
    try {
      const res = await fetch(`${API_BASE}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adjustmentData,
          createdBy: 'admin'
        })
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Adjustment failed')
      }
      // Refresh data
      loadStats()
      loadProducts()
      setSelectedIds([])
    } catch (err) {
      throw err
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/export`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory-export.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleViewHistory = (product) => {
    setSelectedProduct(product)
    setHistoryModalOpen(true)
  }

  // Inline single stock update
  const handleStockUpdate = async (productId, newQuantity) => {
    try {
      const res = await fetch(`${API_BASE}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [productId],
          adjustmentType: 'set',
          quantity: newQuantity,
          reason: 'Inline edit',
          createdBy: 'admin'
        })
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Update failed')
      }
      // Update local state immediately for responsive UI
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, stock_quantity: newQuantity } : p
      ))
      // Refresh stats in background
      loadStats()
    } catch (err) {
      throw err
    }
  }

  const selectedProducts = products.filter(p => selectedIds.includes(p.id))

  return (
    <AdminLayout
      title="Inventory Manager"
      subtitle="Monitor stock levels, adjust quantities, and set reorder points"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <InventoryStats stats={stats} onFilterChange={handleFilterChange} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, name, or brand..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter || ''}
              onChange={(e) => handleFilterChange(e.target.value || null)}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex gap-2">
            {/* Refresh */}
            <button
              onClick={() => { loadStats(); loadProducts(); }}
              className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Adjust Stock */}
            <button
              onClick={() => setAdjustModalOpen(true)}
              disabled={selectedIds.length === 0}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-4 h-4" />
              Adjust Stock ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Selected Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-sm text-emerald-400">
              {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-white/60 hover:text-white"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Stock Table */}
        <StockTable
          products={products}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
          onViewHistory={handleViewHistory}
          onStockUpdate={handleStockUpdate}
          loading={loading}
        />
      </div>

      {/* Adjustment Modal */}
      <StockAdjustmentModal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        selectedProducts={selectedProducts}
        onAdjust={handleAdjust}
      />

      {/* History Modal */}
      <StockHistoryModal
        open={historyModalOpen}
        onClose={() => { setHistoryModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
      />
    </AdminLayout>
  )
}

export default AdminInventory
