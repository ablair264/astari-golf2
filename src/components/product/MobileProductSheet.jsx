import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, ShoppingCart, Minus, Plus, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { cartUtils } from '@/contexts/CartContext'

// Size order for sorting
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', 'STANDARD', 'MIDSIZE', 'OVERSIZE', 'JUMBO', 'UNDERSIZE']

const sortSizes = (sizes) => {
  return [...sizes].sort((a, b) => {
    const aIdx = SIZE_ORDER.findIndex(s => a.toUpperCase().includes(s))
    const bIdx = SIZE_ORDER.findIndex(s => b.toUpperCase().includes(s))
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    const aNum = parseFloat(a)
    const bNum = parseFloat(b)
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    return a.localeCompare(b)
  })
}

const MobileProductSheet = ({ product, onClose, onAddToCart }) => {
  const navigate = useNavigate()
  const variants = product.variants || [product]
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const selectedVariant = useMemo(() => {
    return variants.find((v) => v.id === selectedVariantId) || variants[0]
  }, [variants, selectedVariantId])

  // Get unique sizes
  const sizes = useMemo(() => {
    const allSizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
    return sortSizes(allSizes)
  }, [variants])

  // Get images for carousel
  const images = useMemo(() => {
    const variantImages = selectedVariant?.images || []
    const mainImage = selectedVariant?.image_url || product.image_url
    const allImages = [...variantImages, mainImage].filter(Boolean)
    return allImages.length > 0 ? [...new Set(allImages)] : ['/products/1.png']
  }, [selectedVariant, product])

  const handleViewDetails = () => {
    onClose()
    navigate(`/products/${product.style_no || product.slug || product.id}`)
  }

  const price = parseFloat(selectedVariant.final_price ?? selectedVariant.calculated_price ?? selectedVariant.price ?? product.price_min ?? product.price)

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
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] text-white rounded-t-2xl max-h-[90vh] overflow-y-auto border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="sticky top-0 bg-[#0d121a]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold truncate text-white">{selectedVariant.name || product.name}</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Image Carousel */}
          <div className="relative w-full aspect-square rounded-xl bg-black/10 overflow-hidden border border-white/10">
            <img
              src={images[currentImageIndex]}
              alt={selectedVariant.name || product.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/50 rounded-full text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/50 rounded-full text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            {(selectedVariant.brand_name || product.brand_name) && (
              <p className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">
                {selectedVariant.brand_name || product.brand_name}
              </p>
            )}

            {(selectedVariant.category_name || product.category_name) && (
              <p className="text-sm text-white/60">{selectedVariant.category_name || product.category_name}</p>
            )}

            <div className="text-2xl font-bold text-white">
              {cartUtils.formatPrice(price)}
            </div>

            {/* Colours */}
            {product.colours?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">Colours</h4>
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

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                  Size: <span className="text-white">{selectedSize || 'Select'}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        selectedSize === size
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(selectedVariant.description || product.description) && (
              <div className="pt-2">
                <h3 className="font-medium mb-2 text-sm text-white">Description</h3>
                <p className="text-white/70 text-sm line-clamp-3">{selectedVariant.description || product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            {selectedVariant.stock_quantity !== undefined && (
              <div className="text-sm">
                {selectedVariant.stock_quantity <= 5 && selectedVariant.stock_quantity > 0 ? (
                  <span className="text-orange-300">Only {selectedVariant.stock_quantity} left in stock</span>
                ) : selectedVariant.stock_quantity === 0 ? (
                  <span className="text-red-300">Out of stock</span>
                ) : (
                  <span className="text-emerald-300">In stock</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Quantity</span>
              <div className="flex items-center bg-white/10 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity === 1}
                  className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={() => {
                onAddToCart(selectedVariant, quantity)
                onClose()
              }}
              disabled={selectedVariant.stock_quantity === 0}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg ${
                selectedVariant.stock_quantity === 0
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {selectedVariant.stock_quantity === 0 ? 'Out of Stock' : `Add to Cart - ${cartUtils.formatPrice(price * quantity)}`}
            </button>

            {/* View Full Details Link */}
            <button
              onClick={handleViewDetails}
              className="w-full py-3 rounded-xl border border-white/20 text-white/80 flex items-center justify-center gap-2 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Product Details
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MobileProductSheet
