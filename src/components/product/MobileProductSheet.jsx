import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ShoppingCart } from 'lucide-react'
import { cartUtils } from '@/contexts/CartContext'

const MobileProductSheet = ({ product, onClose, onAddToCart }) => {
  const variants = product.variants || [product]
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id)

  const selectedVariant = useMemo(() => {
    return variants.find((v) => v.id === selectedVariantId) || variants[0]
  }, [variants, selectedVariantId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] text-white rounded-t-2xl max-h-[90vh] overflow-y-auto border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0d121a]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold truncate text-white">{selectedVariant.name || product.name}</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Image */}
          <div className="w-full aspect-square rounded-xl bg-black/10 overflow-hidden border border-white/10">
            <img
              src={selectedVariant.image_url || product.image_url || '/products/1.png'}
              alt={selectedVariant.name || product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            {(selectedVariant.brand_name || product.brand_name) && (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 uppercase tracking-wide">
                {(selectedVariant.brand_logo || product.brand_logo) && (
                  <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/80">
                    <img
                      src={selectedVariant.brand_logo || product.brand_logo}
                      alt={selectedVariant.brand_name || product.brand_name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </span>
                )}
                <span>{selectedVariant.brand_name || product.brand_name}</span>
              </div>
            )}
            <div>
              {(selectedVariant.category_name || product.category_name) && (
                <p className="text-sm text-white/60 mb-2">{selectedVariant.category_name || product.category_name}</p>
              )}
              <div className="text-2xl font-bold text-white">
                {cartUtils.formatPrice(parseFloat(selectedVariant.price ?? product.price_min ?? product.price))}
              </div>
            </div>

            {product.colours?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Colours</h4>
                <div className="flex flex-wrap gap-2">
                  {product.colours.map((c, idx) => (
                    <button
                      key={`${c.colour_hex}-${idx}`}
                      onClick={() => {
                        const match = variants.find(
                          (v) => v.colour_hex === c.colour_hex || v.colour_name === c.colour_name
                        )
                        if (match) setSelectedVariantId(match.id)
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs transition-all ${
                        selectedVariant.colour_hex === c.colour_hex || selectedVariant.colour_name === c.colour_name
                          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-white/80'
                      }`}
                    >
                      <span className="inline-flex h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.colour_hex || '#e5e7eb' }} />
                      <span className="capitalize">{c.colour_name || 'Colour'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedVariant.description || product.description) && (
              <div>
                <h3 className="font-medium mb-2 text-white">Description</h3>
                <p className="text-white/70 text-sm">{selectedVariant.description || product.description}</p>
              </div>
            )}

            {selectedVariant.stock_quantity && (
              <div className="text-sm text-white/70">
                {selectedVariant.stock_quantity <= 5 && selectedVariant.stock_quantity > 0 ? (
                  <span className="text-orange-300">Only {selectedVariant.stock_quantity} left in stock</span>
                ) : selectedVariant.stock_quantity === 0 ? (
                  <span className="text-red-300">Out of stock</span>
                ) : (
                  <span>In stock</span>
                )}
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => {
              onAddToCart(selectedVariant)
              onClose()
            }}
            disabled={selectedVariant.stock_quantity === 0}
            className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 font-medium shadow-lg ${
              selectedVariant.stock_quantity === 0
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-600'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {selectedVariant.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MobileProductSheet
