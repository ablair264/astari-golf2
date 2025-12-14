import React, { useEffect, useState } from 'react'
import { X, Percent, Plus } from 'lucide-react'
import { getAllBrands, updateBrand } from '@/services/brands'

export function RulesPanel({ onClose }) {
  const [brands, setBrands] = useState([])
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [rules, setRules] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllBrands().then((data) => {
      setBrands(data)
      const defaultId = data[0]?.id?.toString() || ''
      setSelectedBrandId(defaultId)
      if (defaultId) {
        const brandRules = data[0].metadata?.margin_rules || []
        setRules(brandRules.map((r, idx) => ({ id: idx + 1, ...r })))
      }
    }).catch(console.error)
  }, [])

  const selectBrand = (id) => {
    setSelectedBrandId(id)
    const brand = brands.find((b) => b.id.toString() === id)
    const brandRules = brand?.metadata?.margin_rules || []
    setRules(brandRules.map((r, idx) => ({ id: idx + 1, ...r })))
  }

  const addRule = () => setRules((prev) => [...prev, { id: Date.now(), label: 'New rule', value: 20 }])
  const updateRule = (id, field, value) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const removeRule = (id) => setRules((prev) => prev.filter((r) => r.id !== id))

  const saveRules = async () => {
    if (!selectedBrandId) return
    const brand = brands.find((b) => b.id.toString() === selectedBrandId)
    if (!brand) return
    setSaving(true)
    try {
      const margin_rules = rules.map(({ id, ...rest }) => rest)
      const metadata = { ...(brand.metadata || {}), margin_rules }
      const updated = await updateBrand(brand.id, { ...brand, metadata })
      setBrands((prev) => prev.map((b) => (b.id === brand.id ? updated : b)))
    } catch (err) {
      console.error('Save rules failed', err)
      alert('Failed to save rules')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full rounded-xl border border-white/10 bg-[#0f1621] text-white p-4 space-y-4 shadow-2xl" style={{ fontFamily: 'Gravesend Sans, sans-serif' }}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Margin Rules</h3>
          <p className="text-sm text-white/60">Apply price multipliers per brand</p>
          <select
            value={selectedBrandId}
            onChange={(e) => selectBrand(e.target.value)}
            className="mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#0f1621]">{b.name}</option>
            ))}
          </select>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white" aria-label="Close rules">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <input
              value={rule.label}
              onChange={(e) => updateRule(rule.id, 'label', e.target.value)}
              className="w-full bg-transparent border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <div className="flex items-center gap-2 text-sm">
              <Percent className="w-4 h-4 text-white/50" />
              <input
                type="number"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, 'value', Number(e.target.value))}
                className="w-20 bg-transparent border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <span className="text-white/60">margin</span>
              <button
                onClick={() => removeRule(rule.id)}
                className="ml-auto text-red-300 hover:text-red-200 px-2 py-1 rounded hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addRule}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 py-2 hover:border-emerald-400 hover:bg-emerald-500/15"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
        <button
          onClick={saveRules}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>
    </div>
  )
}
