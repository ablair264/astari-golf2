import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, User, Eye, Grid3x3, List, Users, RefreshCw,
  ChevronLeft, ChevronRight, Mail, Phone, MapPin, Loader2, X, Building2
} from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/admin/dashboard-sidebar'
import { CustomerFormModal } from '@/components/admin/CustomerFormModal'

const API_BASE = '/.netlify/functions/customers-admin'

async function fetchJSON(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export default function AdminCustomers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('display_name')
  const [sortDir, setSortDir] = useState('asc')
  const [viewMode, setViewMode] = useState('list')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const customersPerPage = 25

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  // Load customers
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('limit', String(customersPerPage))
      params.set('offset', String((currentPage - 1) * customersPerPage))
      params.set('sortBy', sortBy)
      params.set('sortDir', sortDir)
      if (search.trim()) params.set('search', search.trim())

      const data = await fetchJSON(`${API_BASE}?${params}`)
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load customers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, sortDir, currentPage])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortBy, sortDir])

  const totalPages = Math.ceil(total / customersPerPage)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleDateString('en-GB')
    } catch {
      return 'Invalid Date'
    }
  }

  const handleViewCustomer = (customer) => {
    navigate(`/admin/customers/${customer.id}`)
  }

  const handleCreateCustomer = () => {
    setEditingCustomer(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
  }

  const handleCustomerSaved = () => {
    loadCustomers()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const renderListView = () => (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                Customer
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                Contact
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                Location
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                Total Spent
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                Orders
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-white/40 mx-auto" />
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="text-white/40">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No customers found</p>
                    <p className="text-xs mt-1">Try adjusting your search or add a new customer</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => handleViewCustomer(customer)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {customer.logo_url ? (
                        <img
                          src={customer.logo_url}
                          alt={customer.display_name}
                          className="w-10 h-10 rounded-full object-cover bg-white/10"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                          customer.customer_type === 'business'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {customer.customer_type === 'business'
                            ? <Building2 className="w-5 h-5" />
                            : getInitials(customer.display_name)
                          }
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{customer.display_name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                            customer.customer_type === 'business'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {customer.customer_type === 'business' ? 'Business' : 'Individual'}
                          </span>
                        </div>
                        {customer.trading_name && customer.trading_name !== customer.display_name && (
                          <div className="text-white/50 text-xs">{customer.trading_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white/70 text-sm">{customer.email || 'No email'}</div>
                    {customer.phone && (
                      <div className="text-white/50 text-xs">{customer.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white/70 text-sm">
                      {customer.billing_city || customer.billing_postcode || '-'}
                    </div>
                    {customer.location_region && (
                      <div className="text-white/50 text-xs">{customer.location_region}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-medium">{formatCurrency(customer.total_spent)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                      {customer.order_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        title="View Customer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          className="p-2 rounded-lg text-white/60 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading && customers.length === 0 ? (
        <div className="col-span-full text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-white/40 mx-auto" />
        </div>
      ) : customers.length === 0 ? (
        <div className="col-span-full text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p className="text-white/50">No customers found</p>
        </div>
      ) : (
        customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 hover:bg-white/10 cursor-pointer transition-all"
            onClick={() => handleViewCustomer(customer)}
          >
            <div className="flex items-center gap-3 mb-4">
              {customer.logo_url ? (
                <img
                  src={customer.logo_url}
                  alt={customer.display_name}
                  className="w-12 h-12 rounded-full object-cover bg-white/10"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                  customer.customer_type === 'business'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {customer.customer_type === 'business'
                    ? <Building2 className="w-6 h-6" />
                    : getInitials(customer.display_name)
                  }
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium truncate">{customer.display_name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                    customer.customer_type === 'business'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {customer.customer_type === 'business' ? 'B' : 'I'}
                  </span>
                </div>
                {customer.trading_name && customer.trading_name !== customer.display_name && (
                  <p className="text-white/50 text-xs truncate">{customer.trading_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total Spent</span>
                <span className="text-white font-medium">{formatCurrency(customer.total_spent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Orders</span>
                <span className="text-white">{customer.order_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Last Order</span>
                <span className="text-white/70">{formatDate(customer.last_order_date)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewCustomer(customer)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 transition-all"
              >
                <User className="w-4 h-4" />
                View
              </button>
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-all"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] min-h-screen admin-body">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-1">Admin</p>
              <h1 className="text-2xl font-bold text-white admin-heading">Customer List</h1>
              <p className="text-sm text-white/50 mt-1">
                {total} customer{total !== 1 ? 's' : ''} total
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
                <button
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/50 hover:text-white'}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/50 hover:text-white'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={loadCustomers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleCreateCustomer}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-400 hover:to-emerald-600 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Customer
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400/60"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/60 cursor-pointer [&>option]:bg-[#0d121a] [&>option]:text-white"
            >
              <option value="display_name">Sort by Name</option>
              <option value="last_order_date">Sort by Last Order</option>
              <option value="total_spent">Sort by Total Spent</option>
              <option value="order_count">Sort by Order Count</option>
              <option value="created_at">Sort by Date Added</option>
            </select>

            <button
              onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Content */}
          {viewMode === 'list' ? renderListView() : renderGridView()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-white/50">
                Showing {(currentPage - 1) * customersPerPage + 1} to{' '}
                {Math.min(currentPage * customersPerPage, total)} of {total} customers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-white/70 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Form Modal */}
        <CustomerFormModal
          open={showModal}
          onClose={handleCloseModal}
          customer={editingCustomer}
          onSaved={handleCustomerSaved}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
