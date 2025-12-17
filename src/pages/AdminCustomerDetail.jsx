import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, User, Calendar,
  CreditCard, TrendingUp, Package, Clock, Edit, Loader2,
  CheckCircle, AlertCircle
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { CustomerFormModal } from '@/components/admin/CustomerFormModal'

const API_BASE = '/.netlify/functions/customers-admin'

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editModalOpen, setEditModalOpen] = useState(false)

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE}/${id}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch customer')
      }

      setCustomer(data.customer)
    } catch (err) {
      console.error('Error fetching customer:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCustomer()
    }
  }, [id])

  const handleEditSaved = () => {
    fetchCustomer()
    setEditModalOpen(false)
  }

  if (loading) {
    return (
      <AdminLayout title="Customer Details">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (error || !customer) {
    return (
      <AdminLayout title="Customer Details">
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Customer not found</h2>
          <p className="text-white/60 mb-6">{error || 'The requested customer could not be found.'}</p>
          <button
            onClick={() => navigate('/admin/customers')}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Back to Customers
          </button>
        </div>
      </AdminLayout>
    )
  }

  const isIndividual = customer.customer_type === 'individual'
  const hasBillingAddress = customer.billing_address_1 || customer.billing_city
  const hasShippingAddress = customer.shipping_address_1 || customer.shipping_city

  return (
    <AdminLayout title="Customer Details">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/customers')}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>

          <div className="flex items-center gap-4">
            {customer.logo_url ? (
              <img
                src={customer.logo_url}
                alt={customer.display_name}
                className="w-14 h-14 rounded-full object-cover bg-white/10"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold ${
                isIndividual ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {isIndividual ? getInitials(customer.display_name) : <Building2 className="w-6 h-6" />}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{customer.display_name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  customer.is_active
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {customer.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  isIndividual ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {isIndividual ? 'Individual' : 'Business'}
                </span>
              </div>
              {customer.trading_name && customer.trading_name !== customer.display_name && (
                <p className="text-white/50 text-sm mt-1">Trading as: {customer.trading_name}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Customer
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<CreditCard className="w-5 h-5" />}
          title="Total Spent"
          value={formatCurrency(customer.total_spent)}
          color="emerald"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Avg Order Value"
          value={formatCurrency(customer.average_order_value)}
          color="blue"
        />
        <MetricCard
          icon={<Package className="w-5 h-5" />}
          title="Orders"
          value={customer.order_count || 0}
          color="purple"
        />
        <MetricCard
          icon={<AlertCircle className="w-5 h-5" />}
          title="Outstanding"
          value={formatCurrency(customer.outstanding_amount)}
          color={parseFloat(customer.outstanding_amount) > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6 overflow-x-auto">
        {['overview', 'orders', 'financial', 'notes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-emerald-400 border-emerald-400'
                : 'text-white/60 border-transparent hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <InfoCard title="Contact Information" icon={<User className="w-5 h-5" />}>
                {isIndividual && (
                  <>
                    <InfoRow label="First Name" value={customer.first_name} />
                    <InfoRow label="Last Name" value={customer.last_name} />
                  </>
                )}
                <InfoRow label="Email" value={customer.email} isLink={`mailto:${customer.email}`} />
                <InfoRow label="Phone" value={customer.phone} isLink={`tel:${customer.phone}`} />
                <InfoRow label="Region" value={customer.location_region} />
                <InfoRow label="Segment" value={customer.segment} />
              </InfoCard>

              <InfoCard title="Account Details" icon={<Clock className="w-5 h-5" />}>
                <InfoRow label="Customer Since" value={formatDate(customer.created_at)} />
                <InfoRow label="First Order" value={formatDate(customer.first_order_date)} />
                <InfoRow label="Last Order" value={formatDate(customer.last_order_date)} />
                <InfoRow label="Payment Terms" value={customer.payment_terms ? `${customer.payment_terms} days` : 'N/A'} />
                <InfoRow label="Currency" value={customer.currency_code || 'GBP'} />
              </InfoCard>
            </div>

            {/* Addresses */}
            <div className="grid md:grid-cols-2 gap-6">
              {hasBillingAddress && (
                <InfoCard title="Billing Address" icon={<MapPin className="w-5 h-5" />}>
                  <div className="text-white/80 space-y-1">
                    {customer.billing_address_1 && <p>{customer.billing_address_1}</p>}
                    {customer.billing_address_2 && <p>{customer.billing_address_2}</p>}
                    <p>
                      {[customer.billing_city, customer.billing_county].filter(Boolean).join(', ')}
                    </p>
                    <p>{customer.billing_postcode}</p>
                    <p>{customer.billing_country}</p>
                  </div>
                  {customer.billing_postcode && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [customer.billing_address_1, customer.billing_city, customer.billing_postcode].filter(Boolean).join(', ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      <MapPin className="w-4 h-4" />
                      View on Map
                    </a>
                  )}
                </InfoCard>
              )}

              {hasShippingAddress && (
                <InfoCard title="Shipping Address" icon={<MapPin className="w-5 h-5" />}>
                  <div className="text-white/80 space-y-1">
                    {customer.shipping_address_1 && <p>{customer.shipping_address_1}</p>}
                    {customer.shipping_address_2 && <p>{customer.shipping_address_2}</p>}
                    <p>
                      {[customer.shipping_city, customer.shipping_county].filter(Boolean).join(', ')}
                    </p>
                    <p>{customer.shipping_postcode}</p>
                    <p>{customer.shipping_country}</p>
                  </div>
                  {customer.shipping_postcode && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [customer.shipping_address_1, customer.shipping_city, customer.shipping_postcode].filter(Boolean).join(', ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      <MapPin className="w-4 h-4" />
                      View on Map
                    </a>
                  )}
                </InfoCard>
              )}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <InfoCard title="Recent Orders" icon={<Package className="w-5 h-5" />}>
            {customer.recent_orders && customer.recent_orders.length > 0 ? (
              <div className="space-y-3">
                {customer.recent_orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{order.order_number}</p>
                      <p className="text-white/50 text-sm">{formatDate(order.created_at)} • {order.item_count} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(order.total_amount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        order.delivery_status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                        order.delivery_status === 'shipped' ? 'bg-blue-500/20 text-blue-300' :
                        order.delivery_status === 'processing' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {order.delivery_status || 'new'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 italic">No orders yet.</p>
            )}
          </InfoCard>
        )}

        {activeTab === 'financial' && (
          <div className="grid md:grid-cols-3 gap-6">
            <InfoCard title="Spending Summary" icon={<CreditCard className="w-5 h-5" />}>
              <InfoRow label="Total Spent" value={formatCurrency(customer.total_spent)} />
              <InfoRow label="Total Paid" value={formatCurrency(customer.total_paid)} />
              <InfoRow label="Outstanding" value={formatCurrency(customer.outstanding_amount)} />
            </InfoCard>

            <InfoCard title="Order Summary" icon={<Package className="w-5 h-5" />}>
              <InfoRow label="Order Count" value={customer.order_count || 0} />
              <InfoRow label="Average Order Value" value={formatCurrency(customer.average_order_value)} />
              <InfoRow label="Last Order" value={formatDate(customer.last_order_date)} />
            </InfoCard>

            <InfoCard title="Payment Terms" icon={<Clock className="w-5 h-5" />}>
              <InfoRow label="Terms" value={customer.payment_terms ? `${customer.payment_terms} days` : 'N/A'} />
              <InfoRow label="Currency" value={customer.currency_code || 'GBP'} />
              <InfoRow label="Status" value={customer.is_active ? 'Active' : 'Inactive'} />
            </InfoCard>
          </div>
        )}

        {activeTab === 'notes' && (
          <InfoCard title="Customer Notes" icon={<Edit className="w-5 h-5" />}>
            {customer.notes ? (
              <p className="text-white/80 whitespace-pre-wrap">{customer.notes}</p>
            ) : (
              <p className="text-white/50 italic">No notes added yet.</p>
            )}
          </InfoCard>
        )}
      </div>

      {/* Edit Modal */}
      <CustomerFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        customer={customer}
        onSaved={handleEditSaved}
      />
    </AdminLayout>
  )
}

// Helper Components
const MetricCard = ({ icon, title, value, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
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

const InfoCard = ({ title, icon, children }) => (
  <div className="rounded-xl bg-white/5 border border-white/10 p-5">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
      <span className="text-emerald-400">{icon}</span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
)

const InfoRow = ({ label, value, isLink }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-white/50 text-sm">{label}</span>
    {isLink && value ? (
      <a href={isLink} className="text-emerald-400 hover:text-emerald-300 text-sm text-right">
        {value}
      </a>
    ) : (
      <span className="text-white text-sm text-right">{value || 'N/A'}</span>
    )}
  </div>
)
