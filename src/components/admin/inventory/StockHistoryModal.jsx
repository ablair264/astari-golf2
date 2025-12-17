import { useState, useEffect } from 'react'
import { X, Loader2, Package, ArrowUp, ArrowDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_BASE = '/.netlify/functions/inventory-admin'

const ChangeIcon = ({ type, amount }) => {
  if (type === 'set' || amount === 0) {
    return <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">=</span>
  }
  if (amount > 0) {
    return <ArrowUp className="w-5 h-5 text-emerald-400" />
  }
  return <ArrowDown className="w-5 h-5 text-red-400" />
}

const StockHistoryModal = ({ open, onClose, product }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open && product) {
      loadHistory()
    }
  }, [open, product])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/history?product_id=${product.id}&limit=50`)
      const data = await res.json()
      if (data.success) {
        setHistory(data.history)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {product?.image_url ? (
              <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-white/30" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">Stock History</h3>
              <p className="text-xs text-white/50">{product?.sku} • {product?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Current Stock */}
        <div className="px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Current Stock</span>
            <span className="text-2xl font-bold text-white">{product?.stock_quantity ?? 0}</span>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-white/30 mx-auto mb-3" />
              <p className="text-white/50">No stock history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <ChangeIcon type={entry.change_type} amount={entry.change_amount} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-sm font-semibold',
                        entry.change_amount > 0 ? 'text-emerald-400' :
                        entry.change_amount < 0 ? 'text-red-400' :
                        'text-blue-400'
                      )}>
                        {entry.change_type === 'set' ? 'Set to ' : ''}
                        {entry.change_amount > 0 ? '+' : ''}{entry.change_amount} units
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 capitalize">
                        {entry.change_type}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">
                      {entry.previous_quantity} → {entry.new_quantity}
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-white/40 mt-1">{entry.reason}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                      <span>{formatDate(entry.created_at)}</span>
                      {entry.created_by && <span>by {entry.created_by}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockHistoryModal
