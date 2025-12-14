import React, { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { getAllProducts } from '@/services/products'
import { VariantFormModal } from './Modals/VariantFormModal'
import { getAllBrands } from '@/services/brands'

// Treat style_no as grouping key
export function StylesView() {
  const [styles, setStyles] = useState([])
  const [brands, setBrands] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [baseProduct, setBaseProduct] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const [products, brandData] = await Promise.all([getAllProducts(), getAllBrands()])
    setBrands(brandData)
    const map = new Map()
    products.forEach((p) => {
      const key = p.style_no || p.id
      if (!map.has(key)) map.set(key, { style_no: key, items: [] })
      map.get(key).items.push(p)
    })
    const grouped = Array.from(map.values()).map((g) => ({
      style_no: g.style_no,
      items: g.items,
      primary: g.items[0],
    }))
    setStyles(grouped)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Styles</h3>
          <p className="text-sm text-white/60">Grouped by style number</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {styles.map((s) => (
          <div key={s.style_no} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">Style</p>
                <h4 className="text-xl font-semibold text-white">{s.style_no}</h4>
                <p className="text-sm text-white/70">{s.items.length} variants</p>
              </div>
              <button
                className="px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-100 text-sm flex items-center gap-1"
                onClick={() => {
                  setBaseProduct({ ...s.primary, style_no: s.style_no })
                  setModalOpen(true)
                }}
              >
                <Plus className="w-4 h-4" /> Variant
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {s.items.map((v) => (
                <div key={v.id} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    {v.image_url && <img src={v.image_url} alt={v.name} className="w-8 h-8 rounded object-cover" />}
                    <div>
                      <div className="font-semibold text-white">{v.name}</div>
                      <div className="text-xs text-white/60">{v.colour_name || 'Colour'} · £{parseFloat(v.price_with_margin || v.price).toFixed(2)}</div>
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-white/10"
                    onClick={() => { setBaseProduct(v); setModalOpen(true) }}
                  >
                    <Pencil className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <VariantFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant={baseProduct}
        brands={brands}
        styleNo={baseProduct?.style_no}
        baseProduct={baseProduct}
        onSaved={load}
      />
    </div>
  )
}
