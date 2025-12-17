import React, { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, User, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react'

const API_BASE = '/.netlify/functions/customers-admin'

export function CustomerFormModal({ open, onClose, customer, onSaved }) {
  const isEdit = Boolean(customer?.id)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: null, message: '' })
  const [form, setForm] = useState({
    customer_type: 'individual',
    first_name: '',
    last_name: '',
    display_name: '',
    trading_name: '',
    email: '',
    phone: '',
    website: '',
    billing_address_1: '',
    billing_address_2: '',
    billing_city: '',
    billing_county: '',
    billing_postcode: '',
    billing_country: 'United Kingdom',
    notes: '',
  })

  useEffect(() => {
    if (customer) {
      setForm({
        customer_type: customer.customer_type || 'individual',
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        display_name: customer.display_name || '',
        trading_name: customer.trading_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        website: customer.website || '',
        billing_address_1: customer.billing_address_1 || '',
        billing_address_2: customer.billing_address_2 || '',
        billing_city: customer.billing_city || '',
        billing_county: customer.billing_county || '',
        billing_postcode: customer.billing_postcode || '',
        billing_country: customer.billing_country || 'United Kingdom',
        notes: customer.notes || '',
      })
    } else {
      setForm({
        customer_type: 'individual',
        first_name: '',
        last_name: '',
        display_name: '',
        trading_name: '',
        email: '',
        phone: '',
        website: '',
        billing_address_1: '',
        billing_address_2: '',
        billing_city: '',
        billing_county: '',
        billing_postcode: '',
        billing_country: 'United Kingdom',
        notes: '',
      })
    }
    setStatus({ type: null, message: '' })
  }, [customer, open])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus({ type: null, message: '' })

    try {
      let res
      let successMessage = ''

      if (isEdit) {
        res = await fetch(`${API_BASE}/${customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        successMessage = 'Customer updated successfully'
      } else {
        res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        successMessage = 'Customer created successfully'
      }

      const data = await res.json()

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Operation failed')
      }

      setStatus({ type: 'success', message: successMessage })
      onSaved?.()

      setTimeout(() => {
        onClose()
        setStatus({ type: null, message: '' })
      }, 1000)

    } catch (err) {
      console.error('Save failed', err)
      setStatus({ type: 'error', message: err.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const isIndividual = form.customer_type === 'individual'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              {isIndividual ? <User className="w-5 h-5 text-emerald-400" /> : <Building2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{isEdit ? 'Edit Customer' : 'Add Customer'}</h3>
              {isEdit && customer?.display_name && (
                <p className="text-xs text-white/50 mt-0.5">{customer.display_name}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg" disabled={saving}>
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {status.type && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {status.message}
            </div>
          )}

          {/* Customer Type Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Customer Type</label>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => handleChange('customer_type', 'individual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  isIndividual
                    ? 'bg-emerald-500/20 text-emerald-300 border-r border-emerald-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-r border-white/10'
                }`}
              >
                <User className="w-4 h-4" />
                Individual
              </button>
              <button
                type="button"
                onClick={() => handleChange('customer_type', 'business')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  !isIndividual
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Business
              </button>
            </div>
          </div>

          {/* Name Section - Changes based on customer type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              {isIndividual ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              {isIndividual ? 'Personal Information' : 'Business Information'}
            </div>

            {isIndividual ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First Name" required>
                  <input
                    value={form.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="John"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    required
                  />
                </Field>
                <Field label="Last Name" required>
                  <input
                    value={form.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    required
                  />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company Name" required>
                  <input
                    value={form.display_name}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    placeholder="Company Ltd"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    required
                  />
                </Field>
                <Field label="Trading Name">
                  <input
                    value={form.trading_name}
                    onChange={(e) => handleChange('trading_name', e.target.value)}
                    placeholder="Trading as (if different)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Contact Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Mail className="w-4 h-4" />
              Contact Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+44 1234 567890"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </Field>
              {!isIndividual && (
                <Field label="Website">
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <MapPin className="w-4 h-4" />
              Billing Address
            </div>

            <div className="space-y-3">
              <Field label="Address Line 1">
                <input
                  value={form.billing_address_1}
                  onChange={(e) => handleChange('billing_address_1', e.target.value)}
                  placeholder="Street address"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </Field>
              <Field label="Address Line 2">
                <input
                  value={form.billing_address_2}
                  onChange={(e) => handleChange('billing_address_2', e.target.value)}
                  placeholder="Apt, suite, building (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </Field>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="City">
                  <input
                    value={form.billing_city}
                    onChange={(e) => handleChange('billing_city', e.target.value)}
                    placeholder="City"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>
                <Field label="County">
                  <input
                    value={form.billing_county}
                    onChange={(e) => handleChange('billing_county', e.target.value)}
                    placeholder="County"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>
                <Field label="Postcode">
                  <input
                    value={form.billing_postcode}
                    onChange={(e) => handleChange('billing_postcode', e.target.value)}
                    placeholder="SW1A 1AA"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>
                <Field label="Country">
                  <input
                    value={form.billing_country}
                    onChange={(e) => handleChange('billing_country', e.target.value)}
                    placeholder="Country"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about this customer..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 resize-none"
            />
          </Field>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
      {label}
      {required && <span className="text-emerald-400 ml-1">*</span>}
    </label>
    {children}
  </div>
)

export default CustomerFormModal
