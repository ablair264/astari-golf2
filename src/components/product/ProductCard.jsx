import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Check,
  Ruler,
} from 'lucide-react'
import { cartUtils, useCart } from '@/contexts/CartContext'

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

// Size order for sorting
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', 'STANDARD', 'MIDSIZE', 'OVERSIZE', 'JUMBO', 'UNDERSIZE']

const sortSizes = (sizes) => {
  return [...sizes].sort((a, b) => {
    const aIdx = SIZE_ORDER.findIndex(s => a.toUpperCase().includes(s))
    const bIdx = SIZE_ORDER.findIndex(s => b.toUpperCase().includes(s))
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    // Try numeric sort
    const aNum = parseFloat(a)
    const bNum = parseFloat(b)
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    return a.localeCompare(b)
  })
}

// Build variant data structure with colors, images, prices, and sizes
const buildVariants = (product) => {
  // If product has variants array, use it
  if (product.variants?.length) {
    return product.variants.map(v => ({
      id: v.id,
      sku: v.sku,
      colour_name: v.colour_name || 'Default',
      colour_hex: v.colour_hex || '#e5e7eb',
      size: v.size,
      core_size: v.core_size,
      material: v.material,
      price: parseFloat(v.final_price ?? v.calculated_price ?? v.price ?? 0),
      basePrice: parseFloat(v.price ?? 0),
      images: normalizeArray(v.images).concat(v.image_url ? [v.image_url] : []).filter(Boolean),
      stock_quantity: v.stock_quantity,
    }))
  }
  // Single product - treat as single variant
  return [{
    id: product.id,
    sku: product.sku,
    colour_name: product.colour_name || 'Default',
    colour_hex: product.colour_hex || '#e5e7eb',
    size: product.size,
    core_size: product.core_size,
    material: product.material,
    price: parseFloat(product.final_price ?? product.calculated_price ?? product.price ?? 0),
    basePrice: parseFloat(product.price ?? 0),
    images: normalizeArray(product.images).concat(product.image_url ? [product.image_url] : []).filter(Boolean),
    stock_quantity: product.stock_quantity,
  }]
}

// Get unique colors from variants
const getUniqueColors = (variants) => {
  const seen = new Map()
  variants.forEach(v => {
    const key = v.colour_hex || v.colour_name
    if (key && !seen.has(key)) {
      seen.set(key, {
        id: key,
        name: v.colour_name || 'Colour',
        hex: v.colour_hex || '#e5e7eb',
        // Store variant info for this color
        variant: v,
      })
    }
  })
  return Array.from(seen.values())
}

// Get unique sizes from variants
const getUniqueSizes = (variants) => {
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  return sortSizes(sizes)
}

// Get images for a specific color
const getImagesForColor = (variants, colorHex) => {
  const colorVariants = variants.filter(v => (v.colour_hex || v.colour_name) === colorHex)
  const images = colorVariants.flatMap(v => v.images).filter(Boolean)
  // Remove duplicates
  return [...new Set(images)]
}

// Get price range for display (min-max if different)
const getPriceDisplay = (variants, selectedColorHex) => {
  const colorVariants = selectedColorHex
    ? variants.filter(v => (v.colour_hex || v.colour_name) === selectedColorHex)
    : variants

  if (colorVariants.length === 0) return { min: 0, max: 0, isSame: true }

  const prices = colorVariants.map(v => v.price).filter(p => p > 0)
  if (prices.length === 0) return { min: 0, max: 0, isSame: true }

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return { min, max, isSame: min === max }
}

const ProductModal = ({ open, onClose, product, variants, colors, sizes, selectedVariant, onColorSelect, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [liked, setLiked] = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)

  const price = selectedVariant?.price || parseFloat(product.final_price ?? product.calculated_price ?? product.price ?? 0)
  const images = selectedVariant?.images?.length > 0 ? selectedVariant.images : [product.image_url || '/products/1.png']

  // Reset image index when variant changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedVariant])

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

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                Color: <span className="text-white">{selectedVariant?.colour_name || colors[0]?.name}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {colors.map((c, idx) => (
                  <button
                    key={c.id || idx}
                    onClick={() => onColorSelect?.(idx)}
                    className={`size-9 rounded-full border-2 transition-all ${
                      selectedVariant?.colour_hex === c.hex || selectedVariant?.colour_name === c.name
                        ? 'border-white scale-110'
                        : 'border-white/10 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                Size: <span className="text-white">{selectedSize || 'Select'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      selectedSize === size
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Specs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {selectedVariant?.material && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-1">Material</p>
                <p className="text-white text-sm font-medium">{selectedVariant.material}</p>
              </div>
            )}
            {selectedVariant?.core_size && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-1">Core Size</p>
                <p className="text-white text-sm font-medium">{selectedVariant.core_size}</p>
              </div>
            )}
          </div>

          {product.description && (
            <div className="mb-4">
              <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4 mt-auto">
            <div className="flex items-center bg-[#131821] rounded-[5px] h-11 border border-white/5 px-1">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity === 1} className="size-10 text-white/50 hover:text-white disabled:opacity-30" aria-label="Decrease">
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-sm font-bold text-white tabular-nums">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="size-10 text-white/50 hover:text-white" aria-label="Increase">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={() => onAddToCart?.(product, selectedVariant || product, quantity)} className="flex-1 h-11 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center gap-2 hover:bg-emerald-500">
              <ShoppingCart className="w-5 h-5" /> Add to Cart - {cartUtils.formatPrice(price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, onAddToCart, onClick }) => {
  // Build variants from product data
  const variants = useMemo(() => buildVariants(product), [product])
  const colorOptions = useMemo(() => getUniqueColors(variants), [variants])
  const sizes = useMemo(() => getUniqueSizes(variants), [variants])

  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const { isInCart, getCartItem } = useCart()

  // Get the selected color's variant
  const selectedColor = colorOptions[selectedColorIndex]
  const selectedVariant = selectedColor?.variant || variants[0]

  // Get images for the selected color
  const images = useMemo(() => {
    if (selectedVariant?.images?.length > 0) {
      return selectedVariant.images
    }
    // Fallback to all images
    const allImages = variants.flatMap(v => v.images).filter(Boolean)
    return allImages.length > 0 ? [...new Set(allImages)] : [product.image_url || '/products/1.png']
  }, [selectedVariant, variants, product.image_url])

  // Check cart for the selected variant
  const variantId = selectedVariant?.id || product.id
  const inCart = isInCart(variantId)
  const cartItem = getCartItem(variantId)

  const isLowStock = selectedVariant?.stock_quantity > 0 && selectedVariant?.stock_quantity <= 5

  // Get price for selected variant
  const price = selectedVariant?.price || parseFloat(product.final_price ?? product.calculated_price ?? product.price ?? 0)

  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedColorIndex])

  const nextImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }
  const prevImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleAddToCart = () => {
    // Pass the selected variant to cart
    onAddToCart?.(product, selectedVariant || product, quantity)
    setJustAdded(true)
  }

  const handleColorSelect = (index) => {
    setSelectedColorIndex(index)
  }

  // Reset "just added" state after animation
  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => setJustAdded(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [justAdded])

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
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                Color: <span className="text-white/80">{selectedVariant?.colour_name || colorOptions[0]?.name}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((c, index) => (
                  <label
                    key={c.id || index}
                    className={`size-8 rounded-full cursor-pointer relative flex items-center justify-center transition-all shadow-sm ${selectedColorIndex === index ? 'ring-2 ring-white scale-110' : 'ring-2 ring-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.hex, border: c.borderColor ? `2px solid ${c.borderColor}` : '2px solid transparent' }}
                    onClick={(e) => { e.stopPropagation(); handleColorSelect(index) }}
                  >
                    <span className="sr-only">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Size Display */}
          {sizes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <Ruler size={12} />
                Sizes Available
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white/70 uppercase"
                  >
                    {size}
                  </span>
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
              className={`relative w-full overflow-hidden rounded-xl h-12 text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group/btn shadow-lg ${
                justAdded
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-900/40'
                  : inCart
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 shadow-emerald-900/30'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.div
                    key="added"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={19} className="relative z-10" strokeWidth={3} />
                    <span className="relative z-10 text-sm font-bold tracking-wide uppercase">Added to Cart!</span>
                  </motion.div>
                ) : inCart ? (
                  <motion.div
                    key="in-cart"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart size={19} className="relative z-10" strokeWidth={2.5} />
                    <span className="relative z-10 text-sm font-bold tracking-wide uppercase">
                      In Cart ({cartItem?.quantity || 0}) - Add More
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart size={19} className="relative z-10 transition-transform group-hover/btn:rotate-[-8deg] group-hover/btn:scale-110" strokeWidth={2.5} />
                    <span className="relative z-10 text-sm font-bold tracking-wide uppercase">Add to Cart</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Added to cart notification */}
            <AnimatePresence>
              {justAdded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg z-20"
                >
                  Added to cart!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
        variants={variants}
        colors={colorOptions}
        sizes={sizes}
        selectedVariant={selectedVariant}
        onColorSelect={handleColorSelect}
        onAddToCart={(prod, variant, qty) => onAddToCart?.(prod, variant, qty || quantity)}
      />
    </>
  )
}

export default ProductCard
