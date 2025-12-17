import { Package, PackageCheck, AlertTriangle, PackageX } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, subValue, color, onClick }) => (
  <button
    onClick={onClick}
    className={`p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left w-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('400', '500/20').replace('300', '400/20')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </button>
)

const InventoryStats = ({ stats, onFilterChange }) => {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Package}
        label="Total SKUs"
        value={stats.totalSkus?.toLocaleString() || '0'}
        subValue={`${stats.totalUnits?.toLocaleString() || 0} total units`}
        color="text-white"
        onClick={() => onFilterChange?.(null)}
      />
      <StatCard
        icon={PackageCheck}
        label="In Stock"
        value={stats.inStock?.toLocaleString() || '0'}
        subValue="Above reorder point"
        color="text-emerald-400"
        onClick={() => onFilterChange?.('in_stock')}
      />
      <StatCard
        icon={AlertTriangle}
        label="Low Stock"
        value={stats.lowStock?.toLocaleString() || '0'}
        subValue="Below reorder point"
        color="text-amber-400"
        onClick={() => onFilterChange?.('low_stock')}
      />
      <StatCard
        icon={PackageX}
        label="Out of Stock"
        value={stats.outOfStock?.toLocaleString() || '0'}
        subValue="Zero units"
        color="text-red-400"
        onClick={() => onFilterChange?.('out_of_stock')}
      />
    </div>
  )
}

export default InventoryStats
