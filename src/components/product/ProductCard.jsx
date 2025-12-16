import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  ShoppingCart,
  Minus,
  Plus,
  Eye,
} from 'lucide-react'
import { cartUtils } from '@/contexts/CartContext'

const normalizeArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const buildImages = (product) => {
  const candidates = [
    ...normalizeArray(product.images),
    product.image_url,
    product.media,
    ...(product.variants ? product.variants.flatMap((v) => normalizeArray(v.images).concat(v.image_url || [])) : []),
  ].filter(Boolean)
  const seen = new Set()
  const unique = candidates.filter((u) => (seen.has(u) ? false : (seen.add(u), true)))
  return unique.length ? unique : ['/products/1.png']
}

const buildColors = (product) => {
  if (product.colours?.length) {
    return product.colours.map((c, idx) => ({
      id: c.colour_hex || c.colour_name || `color-${idx}`,
      name: c.colour_name || 'Colour',
      hex: c.colour_hex || '#e5e7eb',
    }))
  }
  if (product.variants?.length) {
    const seen = new Set()
    return product.variants
      .map((v) => ({ id: v.colour_hex || v.colour_name || v.id, name: v.colour_name || 'Colour', hex: v.colour_hex || '#e5e7eb' }))
      .filter((c) => (c.id && !seen.has(c.id) ? seen.add(c.id) : false))
  }
  if (product.colour_hex || product.colour_name) {
    return [{ id: product.colour_hex || product.colour_name, name: product.colour_name || 'Colour', hex: product.colour_hex || '#e5e7eb' }]
  }
  return []
}

const ProductModal = ({ open, onClose, product, images, colors, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [liked, setLiked] = useState(false)
  const price = parseFloat(product.price ?? product.price_min ?? 0)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row bg-[#0b1017] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="relative w-full lg:w-[55%] bg-[#0a0e16] border-b lg:border-b-0 lg:border-r border-white/10 group">
          <div className="relative w-full h-[360px] sm:h-[440px] lg:h-full overflow-hidden">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-300 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="w-full h-full bg-center bg-cover bg-no-repeat transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${img})` }} />
              </div>
            ))}
            <div className="absolute top-4 left-4 flex gap-2">
              <button
                onClick={onClose}
                className="size-10 flex items-center justify-center bg-black/50 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/10 rounded-full transition-all shadow-lg"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-black/80"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-black/80"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`transition-all rounded-full ${idx === currentImageIndex ? 'w-8 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col p-6 lg:p-8 grow w-full lg:w-[45%] max-h-[85vh] lg:overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">{product.brand_name || product.brand}</p>
              <h2 className="text-white text-2xl font-extrabold leading-tight">{product.name}</h2>
              <p className="text-gray-400 text-sm font-medium">{product.category_name || product.category}</p>
            </div>
            <button
              onClick={() => setLiked((p) => !p)}
              className={`size-10 rounded-full flex items-center justify-center transition-all border border-white/5 ${liked ? 'bg-pink-500/10 text-pink-500 border-pink-500/40' : 'bg-[#131821] text-gray-300 hover:text-white hover:bg-[#1b2230]'}`}
              aria-label="Favorite"
            >
              <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-white text-3xl font-bold">{cartUtils.formatPrice(price)}</p>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{product.rating || '4.8'} <span className="text-white/40">({product.reviewCount || '120'})</span></span>
            </div>
          </div>
          {colors.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Select Color</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((c, idx) => (
                  <button
                    key={c.id || idx}
                    onClick={() => {}}
                    className="size-9 rounded-full border border-white/10"
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}
          {product.description && (
            <div className="mb-4">
              <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center bg-[#131821] rounded-[5px] h-11 border border-white/5 px-1">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity === 1} className="size-10 text-white/50 hover:text-white disabled:opacity-30" aria-label="Decrease">
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-sm font-bold text-white tabular-nums">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="size-10 text-white/50 hover:text-white" aria-label="Increase">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={() => onAddToCart?.(product, product, quantity)} className="flex-1 h-11 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center gap-2 hover:bg-emerald-500">
              <ShoppingCart className="w-5 h-5" /> Add to Cart - {cartUtils.formatPrice(price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, onAddToCart, onClick }) => {
  const images = useMemo(() => buildImages(product), [product])
  const colorOptions = useMemo(() => buildColors(product), [product])
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const color = colorOptions[selectedColorIndex] || null
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5
  const price = parseFloat(product.price ?? product.price_min ?? 0)

  const nextImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }
  const prevImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleAddToCart = () => {
    onAddToCart?.(product, product, quantity)
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="group relative w-full max-w-[360px] flex flex-col bg-[#111827]/80 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-[15px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-white/5 mx-auto"
        onClick={() => onClick?.(product)}
      >
        <div className="relative w-full p-[10px] pb-0 shrink-0">
          <div
            className="relative w-full aspect-[4/3] rounded-[15px] overflow-hidden bg-[#131811]"
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
          >
            <div
              className={`w-full h-full bg-center bg-cover bg-no-repeat transform transition-transform duration-700 ease-out ${isHoveringImage ? 'scale-110' : 'scale-100'}`}
              style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
              role="img"
              aria-label={`Product image of ${product.name}`}
            />

            {isLowStock && (
              <div className="absolute top-3 left-3 flex gap-2">
                <div className="px-3 py-1 bg-[#0f1621]/90 border border-white/5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wide">Low Stock</span>
                </div>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-black/40 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:bg-black/60 ${isHoveringImage ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-black/40 text-white rounded-full transition-all duration-300 backdrop-blur-sm hover:bg-black/60 ${isHoveringImage ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col p-5 gap-4 grow">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{product.brand_name || product.brand}</p>
                <h3 className="text-white text-xl font-bold leading-tight tracking-tight">{product.name}</h3>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsFavorite((p) => !p) }}
                className={`size-9 rounded-full flex items-center justify-center transition-all shadow-sm border border-white/5 ${isFavorite ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#1b2230] text-white hover:bg-[#2a3344]'}`}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-white/50 text-sm font-medium">{product.category_name || product.category}</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-white text-2xl font-bold">{cartUtils.formatPrice(price || 0)}</p>
            <div className="flex items-center gap-1 text-white/70 text-sm font-medium">
              <Star className="w-[18px] h-[18px] text-yellow-400 fill-yellow-400" />
              <span>
                {product.rating || '4.8'} <span className="text-white/40">({product.reviewCount || '120'})</span>
              </span>
            </div>
          </div>

          {colorOptions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Select Color</p>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((c, index) => (
                  <label
                    key={c.id || index}
                    className={`size-8 rounded-full cursor-pointer relative flex items-center justify-center transition-all shadow-sm ${selectedColorIndex === index ? 'ring-2 ring-white scale-110' : 'ring-2 ring-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.hex, border: c.borderColor ? `2px solid ${c.borderColor}` : '2px solid transparent' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedColorIndex(index) }}
                  >
                    <span className="sr-only">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-3 mt-1">
            <p className="text-white/40 text-xs font-mono">Style No: {product.style_no || '—'}</p>
          </div>

          <div className="flex flex-col gap-3 mt-auto pt-3">
            {/* Top Row: Quantity + View Details */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#1b2230]/60 backdrop-blur-sm rounded-xl h-12 border border-white/10 px-1 shrink-0 shadow-inner">
                <button
                  onClick={(e) => { e.stopPropagation(); setQuantity((q) => Math.max(1, q - 1)) }}
                  disabled={quantity === 1}
                  className="size-10 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-20 transition-all hover:scale-110 disabled:hover:scale-100"
                  aria-label="Decrease quantity"
                >
                  <Minus size={17} strokeWidth={2.5} />
                </button>
                <span className="w-8 text-center text-sm font-bold text-white tabular-nums">{quantity}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setQuantity((q) => q + 1) }}
                  className="size-10 flex items-center justify-center text-white/50 hover:text-white transition-all hover:scale-110"
                  aria-label="Increase quantity"
                >
                  <Plus size={17} strokeWidth={2.5} />
                </button>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}
                className="flex-1 h-12 rounded-xl bg-[#1b2230]/60 backdrop-blur-sm border border-white/10 flex items-center justify-center gap-2 text-white/70 hover:text-white hover:bg-[#2a3344]/80 hover:border-white/20 transition-all shadow-sm hover:shadow-md group/view"
                title="View Details"
                aria-label="View Details"
              >
                <Eye size={19} strokeWidth={2} className="transition-transform group-hover/view:scale-110" />
                <span className="text-xs font-semibold uppercase tracking-wider">Quick View</span>
              </button>
            </div>

            {/* Bottom Row: Add to Cart - Full Width */}
            <button
              onClick={(e) => { e.stopPropagation(); handleAddToCart() }}
              className="relative w-full overflow-hidden rounded-xl h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group/btn shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <ShoppingCart size={19} className="relative z-10 transition-transform group-hover/btn:rotate-[-8deg] group-hover/btn:scale-110" strokeWidth={2.5} />
              <span className="relative z-10 text-sm font-bold tracking-wide uppercase">Add to Cart</span>
            </button>
          </div>
        </div>
      </motion.div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
        images={images}
        colors={colorOptions}
        onAddToCart={(prod, variant, qty) => onAddToCart?.(prod, variant, qty || quantity)}
      />
    </>
  )
}

export default ProductCard
