import React, { useEffect, useState } from 'react'
import { X, Plus, Percent, Tag, ArrowRight } from 'lucide-react'
import RuleCreateModal from '../products/modals/RuleCreateModal'
import RuleEditModal from '../products/modals/RuleEditModal'
import ApplyRuleModal from '../products/modals/ApplyRuleModal'
import SpecialOfferModal from '../products/modals/SpecialOfferModal'

const API_RULES = '/.netlify/functions/margin-rules'
const API_OFFERS = '/.netlify/functions/special-offers'

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) throw new Error(data.error || res.statusText)
  return data
}

export function RulesPanel({ onClose }) {
  const [rules, setRules] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editRule, setEditRule] = useState(null)
  const [applyRule, setApplyRule] = useState(null)
  const [showOffer, setShowOffer] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const [r, o] = await Promise.all([
        fetchJSON(API_RULES),
        fetchJSON(API_OFFERS),
      ])
      setRules(r.rules || [])
      setOffers(o.offers || [])
    } catch (err) {
      console.error('Rules load failed', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (payload) => {
    const res = await fetchJSON(API_RULES, { method: 'POST', body: JSON.stringify(payload) })
    setRules((prev) => [res.rule, ...prev])
    setShowCreate(false)
  }

  const handleEdit = async (id, payload) => {
    const res = await fetchJSON(`${API_RULES}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    setRules((prev) => prev.map((r) => (r.id === id ? res.rule : r)))
    setEditRule(null)
  }

  const handleDelete = async (id) => {
    await fetchJSON(`${API_RULES}/${id}`, { method: 'DELETE' })
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const handleOffer = async (payload) => {
    const res = await fetchJSON(API_OFFERS, { method: 'POST', body: JSON.stringify(payload) })
    setOffers((prev) => [res.offer, ...prev])
    setShowOffer(false)
  }

  return (
    <div className="h-full rounded-xl border border-white/10 bg-[#0f1621] text-white p-4 space-y-4 shadow-2xl" style={{ fontFamily: 'Gravesend Sans, sans-serif' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rules & Offers</h3>
          <p className="text-sm text-white/60">Manage margins and special offers</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white" aria-label="Close rules">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading && <div className="text-white/60 text-sm">Loading rules...</div>}
      {error && <div className="text-red-300 text-sm">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCreate(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-100 py-2 hover:border-purple-400 hover:bg-purple-500/15"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>
        <button
          onClick={() => setShowOffer(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 py-2 hover:border-emerald-400 hover:bg-emerald-500/15"
        >
          <Tag className="w-4 h-4" /> New Offer
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Percent className="w-4 h-4 text-purple-300" />
                <span className="font-semibold text-white">{rule.name}</span>
                <span className="text-white/60">{rule.rule_type}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 text-xs">+{rule.margin_percentage}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm text-white/60 hover:text-white" onClick={() => setEditRule(rule)}>Edit</button>
                <button className="text-sm text-red-300 hover:text-red-200" onClick={() => handleDelete(rule.id)}>Delete</button>
              </div>
            </div>
            <div className="text-xs text-white/60">
              {rule.brand_id ? `Brand #${rule.brand_id}` : ''}
              {rule.category_id ? ` · Category #${rule.category_id}` : ''}
              {rule.style_no ? ` · Style ${rule.style_no}` : ''}
              {rule.sku ? ` · SKU ${rule.sku}` : ''}
            </div>
            <button
              onClick={() => setApplyRule(rule)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-purple-200 hover:text-purple-100"
            >
              Apply rule <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-white">Special Offers</div>
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-white">
              <Tag className="w-4 h-4 text-emerald-300" />
              <span className="font-semibold">{offer.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 text-xs">-{offer.discount_percentage}%</span>
            </div>
            {offer.description && <div className="text-xs text-white/60">{offer.description}</div>}
          </div>
        ))}
      </div>

      {showCreate && (
        <RuleCreateModal open onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}
      {editRule && (
        <RuleEditModal open rule={editRule} onClose={() => setEditRule(null)} onSave={(payload) => handleEdit(editRule.id, payload)} />
      )}
      {applyRule && (
        <ApplyRuleModal open rule={applyRule} onClose={() => setApplyRule(null)} />
      )}
      {showOffer && (
        <SpecialOfferModal open onClose={() => setShowOffer(false)} onSave={handleOffer} />
      )}
    </div>
  )
}

export default RulesPanel
