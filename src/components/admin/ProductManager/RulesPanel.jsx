import React, { useEffect, useState } from 'react'
import { X, Plus, Tag, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import RuleCreateModal from '../products/modals/RuleCreateModal'
import RuleEditModal from '../products/modals/RuleEditModal'
import ApplyRuleModal from '../products/modals/ApplyRuleModal'
import SpecialOfferModal from '../products/modals/SpecialOfferModal'
import { RuleCard } from './RuleCard'

const API_RULES = '/.netlify/functions/margin-rules'
const API_OFFERS = '/.netlify/functions/special-offers'

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) throw new Error(data.error || res.statusText)
  return data
}

// Priority order: SKU (1) > Style (2) > Category (3) > Brand (4) > Default (5)
const getRulePriority = (rule) => {
  if (rule.sku) return 1
  if (rule.style_no) return 2
  if (rule.category_id) return 3
  if (rule.brand_id) return 4
  return 5
}

const PRIORITY_LABELS = {
  1: 'SKU Overrides',
  2: 'Style Rules',
  3: 'Category Rules',
  4: 'Brand Rules',
  5: 'Default Rules',
}

export function RulesPanel({ onClose }) {
  const [rules, setRules] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [applyingAll, setApplyingAll] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editRule, setEditRule] = useState(null)
  const [applyRule, setApplyRule] = useState(null)
  const [showOffer, setShowOffer] = useState(false)
  const [expandedRuleId, setExpandedRuleId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
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
    if (!confirm('Delete this rule?')) return
    await fetchJSON(`${API_RULES}/${id}`, { method: 'DELETE' })
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const handleApplyAll = async () => {
    setApplyingAll(true)
    try {
      // Re-apply all rules by updating each one (which triggers the auto-apply logic)
      for (const rule of rules) {
        await fetchJSON(`${API_RULES}/${rule.id}`, {
          method: 'PUT',
          body: JSON.stringify(rule)
        })
      }
      await load() // Refresh to get updated affected counts
    } catch (err) {
      console.error('Apply all failed:', err)
      setError('Failed to apply all rules')
    } finally {
      setApplyingAll(false)
    }
  }

  const handleOffer = async (payload) => {
    const res = await fetchJSON(API_OFFERS, { method: 'POST', body: JSON.stringify(payload) })
    setOffers((prev) => [res.offer, ...prev])
    setShowOffer(false)
  }

  // Group rules by priority
  const groupedRules = rules.reduce((acc, rule) => {
    const priority = getRulePriority(rule)
    if (!acc[priority]) acc[priority] = []
    acc[priority].push(rule)
    return acc
  }, {})

  const totalAffected = rules.reduce((sum, r) => sum + (Number(r.affected_count) || 0), 0)

  return (
    <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-lg font-semibold admin-heading">Rules & Offers</h3>
          <p className="text-xs text-white/50 mt-0.5">
            {rules.length} rules · {totalAffected} products affected
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-white/10 shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 py-2.5 hover:border-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> New Rule
          </button>
          <button
            onClick={() => setShowOffer(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-100 py-2.5 hover:border-amber-400 hover:bg-amber-500/15 text-sm font-medium transition-all"
          >
            <Tag className="w-4 h-4" /> New Offer
          </button>
        </div>
        <button
          onClick={handleApplyAll}
          disabled={applyingAll || rules.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-white/70 py-2.5 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
        >
          {applyingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Apply All Rules
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Rules grouped by priority */}
        {!loading && Object.keys(groupedRules).sort((a, b) => Number(a) - Number(b)).map((priority) => (
          <div key={priority} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                {PRIORITY_LABELS[priority]}
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="text-xs text-white/30">
                Priority {priority}
              </div>
            </div>
            <div className="space-y-2">
              {groupedRules[priority].map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  expanded={expandedRuleId === rule.id}
                  onToggleExpand={(expanded) => setExpandedRuleId(expanded ? rule.id : null)}
                  onEdit={setEditRule}
                  onDelete={handleDelete}
                  onApply={setApplyRule}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Special Offers */}
        {offers.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Special Offers
              </div>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="space-y-2">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{offer.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-xs">
                          -{offer.discount_percentage}%
                        </span>
                      </div>
                      {offer.description && (
                        <p className="text-xs text-white/50 mt-0.5">{offer.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && rules.length === 0 && offers.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Tag className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/50 text-sm">No rules or offers yet</p>
            <p className="text-white/30 text-xs mt-1">Create your first rule to get started</p>
          </div>
        )}
      </div>

      {/* Modals */}
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
