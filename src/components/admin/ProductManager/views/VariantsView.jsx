import React, { useEffect, useState } from 'react'
import { useDrillDown } from '../DrillDownContext'
import { getAllProducts } from '@/services/products'

export function VariantsView() {
  const { toggleSku, selectedSkus } = useDrillDown()
  const [variants, setVariants] = useState([])

  useEffect(() => {
    getAllProducts().then(setVariants).catch(console.error)
  }, [])

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {variants.map((variant) => (
        <label
          key={variant.id}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSkus.includes(variant.sku)
              ? 'border-emerald-400/60 bg-emerald-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedSkus.includes(variant.sku)}
              onChange={() => toggleSku(variant.sku)}
              className="accent-emerald-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase text-white/60">{variant.brand_name}</span>
                {variant.style_no && <span className="text-xs text-white/50">Style {variant.style_no}</span>}
              </div>
              <h4 className="text-white font-semibold truncate">{variant.name}</h4>
              {variant.colour_name && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="inline-flex h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: variant.colour_hex || '#e5e7eb' }} />
                  <span className="capitalize">{variant.colour_name}</span>
                  {variant.sku && <span className="text-white/40">SKU {variant.sku}</span>}
                </div>
              )}
              <div className="text-sm text-white/70">
                £{parseFloat(variant.price_with_margin || variant.price).toFixed(2)}
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
  )
}
