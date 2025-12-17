import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Truck, Hash, Calendar, MessageSquare,
  AlertTriangle, Loader2
} from 'lucide-react'

const COURIERS = [
  { id: 'royal_mail', name: 'Royal Mail' },
  { id: 'dhl', name: 'DHL Express' },
  { id: 'ups', name: 'UPS' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'dpd', name: 'DPD' },
  { id: 'evri', name: 'Evri (Hermes)' },
  { id: 'yodel', name: 'Yodel' },
  { id: 'parcelforce', name: 'Parcelforce' },
  { id: 'amazon', name: 'Amazon Logistics' },
  { id: 'other', name: 'Other' },
]

const API_BASE = '/.netlify/functions/orders-admin'

export default function ShippingBookingModal({ open, onClose, orderId, onSuccess }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    courier: '',
    trackingNumber: '',
    expectedDeliveryDate: '',
    notes: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.courier || !formData.trackingNumber) {
      setError('Please select a courier and enter a tracking number')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/${orderId}/book-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier: formData.courier,
          tracking_number: formData.trackingNumber,
          expected_delivery_date: formData.expectedDeliveryDate || null,
          shipping_notes: formData.notes || null,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to book delivery')
      }

      // Reset form
      setFormData({
        courier: '',
        trackingNumber: '',
        expectedDeliveryDate: '',
        notes: '',
      })

      onClose()
      onSuccess?.()
    } catch (err) {
      console.error('Failed to book delivery:', err)
      setError(err.message || 'Failed to book delivery')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#1e2329] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Book Delivery</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Courier Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <Truck className="w-4 h-4" />
              Courier *
            </label>
            <select
              value={formData.courier}
              onChange={(e) => handleChange('courier', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            >
              <option value="">Select a courier...</option>
              {COURIERS.map(courier => (
                <option key={courier.id} value={courier.id}>
                  {courier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <Hash className="w-4 h-4" />
              Tracking Number *
            </label>
            <input
              type="text"
              value={formData.trackingNumber}
              onChange={(e) => handleChange('trackingNumber', e.target.value)}
              placeholder="Enter tracking number..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <Calendar className="w-4 h-4" />
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <MessageSquare className="w-4 h-4" />
              Shipping Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any special shipping instructions..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.courier || !formData.trackingNumber}
              className="flex-1 px-4 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  Book Delivery
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
