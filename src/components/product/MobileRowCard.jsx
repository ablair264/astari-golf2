import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { cartUtils } from '@/contexts/CartContext'

const MobileRowCard = ({ product, onAddToCart, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex gap-4 p-4 bg-gradient-to-br from-[#0f1621] via-[#0c111a] to-[#0a0f17] border border-white/10 rounded-2xl hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-shadow cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-black/10 overflow-hidden border border-white/10">
        <img
          src={product.image_url || '/products/1.png'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {product.brand_name && (
            <div className="flex items-center gap-2 mb-0.5 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              {product.brand_logo && (
                <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/70">
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
          <h3 className="font-medium text-white truncate">{product.name}</h3>
          {product.category_name && (
            <p className="text-sm text-white/60">{product.category_name}</p>
          )}
          {product.colours?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
              {product.colours.slice(0, 4).map((c, idx) => (
                <span
                  key={`${c.colour_hex}-${idx}`}
                  className="inline-flex h-3.5 w-3.5 rounded-full border border-black/20"
                  style={{ backgroundColor: c.colour_hex || '#e5e7eb' }}
                />
              ))}
              {product.colours.length > 4 && (
                <span className="text-[11px] text-white/50">+{product.colours.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-white">
            {cartUtils.formatPrice(parseFloat(product.final_price_min ?? product.price_min ?? product.final_price ?? product.calculated_price ?? product.price))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            disabled={product.stock_quantity === 0}
            className={`p-2 rounded-lg ${
              product.stock_quantity === 0
                ? 'bg-gray-200 text-gray-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default MobileRowCard
