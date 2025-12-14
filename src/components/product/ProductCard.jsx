import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { cartUtils } from '@/contexts/CartContext'

const ProductCard = ({ product, onAddToCart, onClick }) => {
  const variants = product.variants || [product]
  const [activeVariantId, setActiveVariantId] = useState(variants[0]?.id)
  const activeVariant = useMemo(
    () => variants.find((v) => v.id === activeVariantId) || variants[0] || product,
    [variants, activeVariantId, product]
  )

  const displayImage = activeVariant.image_url || activeVariant.media || product.image_url || '/products/1.png'
  const displayPrice = activeVariant.price ?? product.price_min ?? product.price

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="group cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1621] to-[#0c111a] aspect-square border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <img
          src={displayImage}
          alt={activeVariant.name || product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Low Stock
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Out of Stock
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {product.brand_name && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
            {product.brand_logo && (
              <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/70">
                <img
                  src={product.brand_logo}
                  alt={product.brand_name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </span>
            )}
            <span>{product.brand_name}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
              {activeVariant.name || product.name}
            </h3>
            {product.category_name && (
              <p className="text-sm text-white/60">{product.category_name}</p>
            )}
          </div>
          <div className="text-lg font-bold text-white whitespace-nowrap">
            {cartUtils.formatPrice(parseFloat(displayPrice))}
          </div>
        </div>

        {product.colours?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/60">
            {product.colours.slice(0, 5).map((c, idx) => (
              <button
                key={`${c.colour_hex}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation()
                  const match = variants.find(
                    (v) => v.colour_hex === c.colour_hex || v.colour_name === c.colour_name
                  )
                  if (match) setActiveVariantId(match.id)
                }}
                className={`inline-flex h-4 w-4 rounded-full border border-black/20 shadow transition-transform ${
                  activeVariant.colour_hex === c.colour_hex || activeVariant.colour_name === c.colour_name
                    ? 'ring-2 ring-emerald-400 scale-105'
                    : 'hover:scale-105'
                }`}
                title={c.colour_name || 'Colour'}
                style={{ backgroundColor: c.colour_hex || '#e5e7eb' }}
              />
            ))}
            {product.colours.length > 5 && (
              <span className="text-[11px] text-white/50">+{product.colours.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
          <span className="uppercase tracking-[0.12em]">Style {product.style_no || '—'}</span>
          {product.price_min && product.price_max && product.price_max !== product.price_min && (
            <span className="text-white/50">Range up to {cartUtils.formatPrice(product.price_max)}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart(product, activeVariant)
          }}
          disabled={(activeVariant.stock_quantity ?? product.stock_quantity) === 0}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            (activeVariant.stock_quantity ?? product.stock_quantity) === 0
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm font-medium">
            {(activeVariant.stock_quantity ?? product.stock_quantity) === 0 ? 'Out of Stock' : 'Add to Cart'}
          </span>
        </button>
      </div>
    </motion.div>
  )
}

export default ProductCard
