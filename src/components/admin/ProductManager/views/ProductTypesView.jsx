import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categories'

export function ProductTypesView() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateCategory(editing.id, payload)
      } else {
        await createCategory(payload)
      }
      await load()
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Save category failed', err)
      alert('Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await deleteCategory(id)
      await load()
    } catch (err) {
      console.error('Delete failed', err)
      alert('Delete failed')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Product Types</h3>
          <p className="text-sm text-white/60">Manage categories used across products.</p>
        </div>
        <button
          className="px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-100 text-sm flex items-center gap-1"
          onClick={() => { setEditing(null); setModalOpen(true) }}
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-white/60">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">Slug: {c.slug}</p>
                  <h4 className="text-lg font-semibold text-white">{c.name}</h4>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-2 rounded-lg hover:bg-white/10"
                    onClick={() => { setEditing(c); setModalOpen(true) }}
                  >
                    <Pencil className="w-4 h-4 text-white/70" />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-red-500/10"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-300" />
                  </button>
                </div>
              </div>
              {c.description && <p className="text-sm text-white/70">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        category={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}

const CategoryModal = ({ open, onClose, onSave, category }) => {
  const [form, setForm] = useState({ name: '', slug: '', description: '' })

  useEffect(() => {
    if (category) {
      setForm({ name: category.name || '', slug: category.slug || '', description: category.description || '' })
    } else {
      setForm({ name: '', slug: '', description: '' })
    }
  }, [category])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-[#0f1621] border border-white/10 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold">{category ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              required
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
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
