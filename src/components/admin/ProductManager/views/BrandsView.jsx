import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getAllBrands, createBrand, updateBrand, deleteBrand } from '@/services/brands'

export function BrandsView() {
  const [brands, setBrands] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    getAllBrands().then(setBrands).catch(console.error)
  }, [])

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateBrand(editing.id, payload)
      } else {
        await createBrand(payload)
      }
      const data = await getAllBrands()
      setBrands(data)
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Save brand failed', err)
      alert('Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand?')) return
    await deleteBrand(id)
    const data = await getAllBrands()
    setBrands(data)
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Brands</h3>
        <button
          className="px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-100 text-sm flex items-center gap-1"
          onClick={() => { setEditing(null); setModalOpen(true) }}
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {brands.map((brand) => (
        <div key={brand.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            {brand.logo_url && (
              <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/80">
                <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" />
              </span>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{brand.name}</h3>
              <p className="text-sm text-white/60">{brand.slug}</p>
            </div>
            <div className="ml-auto flex gap-1">
              <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => { setEditing(brand); setModalOpen(true) }}>
                <Pencil className="w-4 h-4 text-white/70" />
              </button>
              <button className="p-2 rounded-lg hover:bg-red-500/10" onClick={() => handleDelete(brand.id)}>
                <Trash2 className="w-4 h-4 text-red-300" />
              </button>
            </div>
          </div>
          {brand.description && <p className="text-sm text-white/70 mt-3">{brand.description}</p>}
        </div>
      ))}
      </div>

      <BrandModal
        open={modalOpen}
        brand={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}

const BrandModal = ({ open, onClose, onSave, brand }) => {
  const [form, setForm] = useState({ name: '', slug: '', description: '', website: '', logo_url: '' })

  useEffect(() => {
    if (brand) {
      setForm({
        name: brand.name || '',
        slug: brand.slug || '',
        description: brand.description || '',
        website: brand.website || '',
        logo_url: brand.logo_url || ''
      })
    } else {
      setForm({ name: '', slug: '', description: '', website: '', logo_url: '' })
    }
  }, [brand])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold">{brand ? 'Edit Brand' : 'Add Brand'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60" required />
          </Field>
          <Field label="Slug">
            <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60" required />
          </Field>
          <Field label="Website">
            <input value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60" />
          </Field>
          <Field label="Logo URL">
            <input value={form.logo_url} onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-white/15 text-white hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm text-white/70">{label}</label>
    {children}
  </div>
)
