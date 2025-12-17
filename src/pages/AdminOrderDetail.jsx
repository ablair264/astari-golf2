import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import ShippingBookingModal from '@/components/admin/ShippingBookingModal'
import {
  ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin,
  User, Mail, Phone, CreditCard, Edit, Copy, RotateCcw,
  ChevronRight, Loader2, AlertCircle, Calendar, Hash,
  ShoppingBag, MapPinned
} from 'lucide-react'

const API_BASE = '/.netlify/functions/orders-admin'

const STATUS_CONFIG = {
  new: { label: 'New Order', icon: Clock, color: 'blue', step: 1 },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'purple', step: 2 },
  delivery_booked: { label: 'Delivery Booked', icon: Truck, color: 'yellow', step: 3 },
  in_transit: { label: 'In Transit', icon: MapPin, color: 'orange', step: 4 },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'emerald', step: 5 },
}

const STEPS = [
  { key: 'new', label: 'New', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'delivery_booked', label: 'Booked', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [nextStatus, setNextStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progressing, setProgressing] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/${id}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch order')
      }

      setOrder(data.order)
      setLineItems(data.lineItems || [])
      setNextStatus(data.nextStatus)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchOrder()
  }, [id])

  const handleProgressOrder = async () => {
    // If next status is delivery_booked, show modal instead
    if (nextStatus === 'delivery_booked') {
      setShowBookingModal(true)
      return
    }

    setProgressing(true)
    try {
      const res = await fetch(`${API_BASE}/${id}/progress`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setOrder(data.order)
        setNextStatus(data.nextStatus)
      }
    } catch (err) {
      console.error('Failed to progress order:', err)
    } finally {
      setProgressing(false)
    }
  }

  const handleDuplicateOrder = async () => {
    setDuplicating(true)
    try {
      const res = await fetch(`${API_BASE}/${id}/duplicate`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        navigate(`/admin/orders/${data.order.id}`)
      }
    } catch (err) {
      console.error('Failed to duplicate order:', err)
    } finally {
      setDuplicating(false)
    }
  }

  const handleBookingSuccess = () => {
    setShowBookingModal(false)
    fetchOrder()
  }

  if (loading) {
    return (
      <AdminLayout title="Order Details">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (error || !order) {
    return (
      <AdminLayout title="Order Details">
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Order not found</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Back to Orders
          </button>
        </div>
      </AdminLayout>
    )
  }

  const status = STATUS_CONFIG[order.delivery_status] || STATUS_CONFIG.new
  const StatusIcon = status.icon
  const currentStep = status.step
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address || '{}')
    : (order.shipping_address || {})

  return (
    <AdminLayout title="Order Details">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">
                {order.order_number || `#${order.id}`}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-${status.color}-500/20 text-${status.color}-300`}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-1">
              Created {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicateOrder}
            disabled={duplicating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
          >
            {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Duplicate
          </button>

          {nextStatus && (
            <button
              onClick={handleProgressOrder}
              disabled={progressing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                nextStatus === 'delivery_booked'
                  ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {progressing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : nextStatus === 'delivery_booked' ? (
                <Truck className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {nextStatus === 'confirmed' && 'Confirm Order'}
              {nextStatus === 'delivery_booked' && 'Book Delivery'}
              {nextStatus === 'in_transit' && 'Mark In Transit'}
              {nextStatus === 'delivered' && 'Mark Delivered'}
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = currentStep > index + 1
            const isCurrent = currentStep === index + 1
            const isUpcoming = currentStep < index + 1

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isCurrent ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 ${isCurrent ? 'text-emerald-400 font-medium' : 'text-white/50'}`}>
                    {step.label}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > index + 1 ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Order Items ({lineItems.length})</h3>
            </div>

            <div className="divide-y divide-white/5">
              {lineItems.length === 0 ? (
                <div className="p-6 text-center text-white/50">
                  No items in this order
                </div>
              ) : (
                lineItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.product_name}</p>
                      {item.sku && (
                        <p className="text-white/50 text-xs">SKU: {item.sku}</p>
                      )}
                      <p className="text-white/60 text-sm">
                        {formatCurrency(item.unit_price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Totals */}
            <div className="px-5 py-4 border-t border-white/10 bg-white/5 space-y-2">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping_amount)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-emerald-400">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Tracking Info (if shipped) */}
          {order.tracking_number && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Shipping Information</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow icon={<Truck className="w-4 h-4" />} label="Courier" value={order.courier} />
                <InfoRow icon={<Hash className="w-4 h-4" />} label="Tracking #" value={order.tracking_number} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Expected Delivery" value={order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'N/A'} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Shipped At" value={order.shipped_at ? formatDate(order.shipped_at) : 'N/A'} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Customer & Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Customer</h3>
            </div>

            <div className="space-y-3">
              <p className="text-white font-medium">
                {order.customer_display_name || order.customer_name || 'Guest Customer'}
              </p>
              {order.customer_email && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Mail className="w-4 h-4" />
                  {order.customer_email}
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Phone className="w-4 h-4" />
                  {order.customer_phone}
                </div>
              )}

              {order.customer_id && (
                <button
                  onClick={() => navigate(`/admin/customers/${order.customer_id}`)}
                  className="mt-3 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-all"
                >
                  View Customer Profile
                </button>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPinned className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Shipping Address</h3>
            </div>

            <div className="text-white/80 space-y-1 text-sm">
              {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
              {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
              {shippingAddress.city && <p>{shippingAddress.city}</p>}
              {shippingAddress.postcode && <p>{shippingAddress.postcode}</p>}
              {shippingAddress.country && <p>{shippingAddress.country}</p>}
              {!shippingAddress.line1 && <p className="text-white/50 italic">No address provided</p>}
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Payment</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Method</span>
                <span className="text-white">{order.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  order.payment_status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {order.payment_status || 'pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
              <p className="text-white/70 text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Booking Modal */}
      <ShippingBookingModal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        orderId={id}
        onSuccess={handleBookingSuccess}
      />
    </AdminLayout>
  )
}

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-white/50 mt-0.5">{icon}</span>
    <div>
      <p className="text-white/50 text-xs">{label}</p>
      <p className="text-white text-sm">{value || 'N/A'}</p>
    </div>
  </div>
)
