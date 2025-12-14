import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { getAllProducts, updateProduct, deleteProduct } from '@/services/products'
import { getSignedUploadUrl, uploadFileToSignedUrl } from '@/services/uploads'
import { getAllBrands } from '@/services/brands'
import { ProductFormModal } from './Modals/ProductFormModal'

export function AllProductsView() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [uploadingId, setUploadingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const [data, brandData] = await Promise.all([
      getAllProducts(),
      getAllBrands(),
    ])
    setProducts(data)
    setBrands(brandData)
  }

  const handleUpload = async (product) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        setUploadingId(product.id)
        const { uploadUrl, publicUrl } = await getSignedUploadUrl(product.brand_slug || 'astari', file.name)
        await uploadFileToSignedUrl(uploadUrl, file)
        await updateProduct(product.id, { ...product, image_url: publicUrl })
        await load()
      } catch (err) {
        console.error('Upload failed', err)
        alert('Upload failed')
      } finally {
        setUploadingId(null)
      }
    }
    input.click()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    await load()
  }

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const bulkDelete = async () => {
    if (selected.length === 0) return
    if (!confirm(`Delete ${selected.length} products?`)) return
    for (const id of selected) {
      await deleteProduct(id)
    }
    setSelected([])
    await load()
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">All Products</h3>
          <p className="text-sm text-white/60">{products.length} items</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setModalOpen(true) }}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex items-center justify-between text-white/70 text-sm">
        <div>{selected.length} selected</div>
        <div className="flex gap-2">
          <button
            onClick={bulkDelete}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-200 text-sm"
            disabled={selected.length === 0}
          >
            Delete selected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4">
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-black/10 border border-white/10 flex-shrink-0 relative">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <button
              onClick={() => handleUpload(p)}
              className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
              disabled={uploadingId === p.id}
            >
              {uploadingId === p.id ? 'Uploading...' : 'Upload'}
            </button>
          </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-[0.12em]">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="accent-emerald-500" />
                <span>{p.brand_name}</span>
                {p.style_no && <span className="text-white/40">Style {p.style_no}</span>}
              </div>
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>{p.category_name}</span>
              {p.colour_name && (
                <span className="flex items-center gap-1 text-xs text-white/60">
                  <span className="inline-flex h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: p.colour_hex || '#e5e7eb' }} />
                  <span className="capitalize">{p.colour_name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-white font-semibold">
              £{parseFloat(p.price_with_margin || p.price).toFixed(2)}
              {p.price_min && p.price_max && p.price_max !== p.price_min && (
                <span className="text-xs text-white/50">Range up to £{parseFloat(p.price_max).toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>{p.stock_quantity || 0} in stock</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-100 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Variant
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm flex items-center gap-1"
                onClick={() => { setEditingProduct(p); setModalOpen(true) }}
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-200 text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        brands={brands}
        onSaved={load}
      />
    </div>
  )
}
