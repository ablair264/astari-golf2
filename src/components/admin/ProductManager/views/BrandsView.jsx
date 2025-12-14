import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { getAllBrands } from '@/services/brands'

export function BrandsView() {
  const [brands, setBrands] = useState([])

  useEffect(() => {
    getAllBrands().then(setBrands).catch(console.error)
  }, [])

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
          {brand.description && <p className="text-sm text-white/70 mt-3">{brand.description}</p>}
        </div>
      ))}

      <button className="p-4 rounded-xl border border-dashed border-white/20 text-white/70 hover:text-white hover:border-white/40 flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Brand
      </button>
    </div>
  )
}
