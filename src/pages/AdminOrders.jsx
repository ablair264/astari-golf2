import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Package, Search, RefreshCw, Eye, ChevronRight, ChevronLeft,
  Clock, CheckCircle, Truck, MapPin, ShoppingBag, TrendingUp,
  AlertCircle, Loader2
} from 'lucide-react'

const API_BASE = '/.netlify/functions/orders-admin'

const ORDER_STATUSES = [
  { key: 'all', label: 'All Orders', color: 'white' },
  { key: 'new', label: 'New', color: 'blue' },
  { key: 'confirmed', label: 'Confirmed', color: 'purple' },
  { key: 'delivery_booked', label: 'Delivery Booked', color: 'yellow' },
  { key: 'in_transit', label: 'In Transit', color: 'orange' },
  { key: 'delivered', label: 'Delivered', color: 'emerald' },
]

const STATUS_CONFIG = {
  new: { label: 'New Order', icon: Clock, color: 'blue', nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'purple', nextLabel: 'Book Delivery' },
  delivery_booked: { label: 'Delivery Booked', icon: Truck, color: 'yellow', nextLabel: 'Mark In Transit' },
  in_transit: { label: 'In Transit', icon: MapPin, color: 'orange', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'emerald', nextLabel: null },
}

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [statusCounts, setStatusCounts] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [progressingId, setProgressingId] = useState(null)
  const pageSize = 20

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const res = await fetch(`${API_BASE}?${params}`)
      const data = await res.json()

      if (data.success) {
        setOrders(data.orders)
        setTotal(data.total)
        setStatusCounts(data.statusCounts || {})
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/metrics`)
      const data = await res.json()
      if (data.success) {
        setMetrics(data.metrics)
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchMetrics()
  }, [fetchOrders])

  const handleProgressOrder = async (orderId, e) => {
    e.stopPropagation()
    setProgressingId(orderId)

    try {
      const res = await fetch(`${API_BASE}/${orderId}/progress`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        // Update the order in the list
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, delivery_status: data.newStatus, status: data.newStatus } : o
        ))
        fetchMetrics()
      }
    } catch (err) {
      console.error('Failed to progress order:', err)
    } finally {
      setProgressingId(null)
    }
  }

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AdminLayout title="Orders" subtitle="Manage customer orders">
      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Package className="w-5 h-5" />}
            title="Total Orders"
            value={metrics.total_orders || 0}
            color="emerald"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Total Revenue"
            value={formatCurrency(metrics.total_revenue)}
            color="blue"
          />
          <MetricCard
            icon={<ShoppingBag className="w-5 h-5" />}
            title="Avg Order Value"
            value={formatCurrency(metrics.avg_order_value)}
            color="purple"
          />
          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            title="Pending Orders"
            value={metrics.pending_orders || 0}
            color="yellow"
          />
        </div>
      )}

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ORDER_STATUSES.map(s => {
          const count = s.key === 'all'
            ? total
            : (statusCounts[s.key] || 0)

          return (
            <button
              key={s.key}
              onClick={() => { setStatusFilter(s.key); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                statusFilter === s.key
                  ? `bg-${s.color}-500/20 text-${s.color}-300 border border-${s.color}-500/30`
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s.label}
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                statusFilter === s.key ? `bg-${s.color}-500/30` : 'bg-white/10'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search & Refresh */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by order number, customer name, or email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <button
          onClick={() => { fetchOrders(); fetchMetrics() }}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p className="text-white/60">No orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Order #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = STATUS_CONFIG[order.delivery_status] || STATUS_CONFIG.new
                const StatusIcon = status.icon

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleViewOrder(order.id)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="font-mono text-emerald-400 font-medium">
                        {order.order_number || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/70 text-sm">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium">
                          {order.customer_display_name || order.customer_name || 'Guest'}
                        </p>
                        {order.customer_email && (
                          <p className="text-white/50 text-xs">{order.customer_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-white/10 text-white/70">
                        {order.payment_method || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {order.item_count || 0}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${status.color}-500/20 text-${status.color}-300`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id) }}
                          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {status.nextLabel && (
                          <button
                            onClick={(e) => handleProgressOrder(order.id, e)}
                            disabled={progressingId === order.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              order.delivery_status === 'confirmed'
                                ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                            title={status.nextLabel}
                          >
                            {progressingId === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            {status.nextLabel}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-sm text-white/60">
              Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} of {total} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/70">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

// Metric Card Component
const MetricCard = ({ icon, title, value, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-white/60 text-sm">{title}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  )
}
