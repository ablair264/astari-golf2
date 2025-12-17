import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/contexts/ToastContext'

/**
 * StandardProductCard - A clean, traditional e-commerce product card
 * Use this for grid layouts and standard product displays
 */
const StandardProductCard = ({ product, index = 0 }) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { showCartToast } = useToast()

  // Get image URL
  const imageUrl = product?.image_url || product?.media || '/images/placeholder.png'
  const secondaryImage = product?.images?.[1] || product?.gallery?.[1] || null

  // Check states
  const isWishlisted = isInWishlist(product.id)
  const inCart = isInCart(product.id)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(product, 1)
    showCartToast({
      name: product.name,
      media: imageUrl,
      final_price: product.final_price ?? product.calculated_price ?? product.price,
    }, 1)
  }

  const handleWishlistClick = (e) => {
    e.stopPropagation()
    toggleWishlist(product)
  }

  const handleViewClick = (e) => {
    e.stopPropagation()
    navigate(`/products/${product.id}`)
  }

  const price = Number(product.final_price ?? product.calculated_price ?? product.price)
  const originalPrice = product.base_price ? Number(product.base_price) : null
  const hasDiscount = originalPrice && originalPrice > price

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container */}
      <div className="relative bg-white rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
        {/* Image Container */}
        <div
          onClick={handleViewClick}
          className="relative aspect-[4/5] overflow-hidden cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100"
        >
          {/* Primary Image */}
          <img
            src={imageUrl}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100" : "opacity-0",
              isHovered && secondaryImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
            )}
          />

          {/* Secondary Image (shows on hover) */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} - alternate view`}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all duration-700",
                isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
            />
          )}

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Quick Action Buttons */}
          <div className={cn(
            "absolute top-4 right-4 flex flex-col gap-2 transition-all duration-500",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}>
            <button
              onClick={handleWishlistClick}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg",
                isWishlisted
                  ? "bg-rose-500 text-white"
                  : "bg-white/90 text-gray-700 hover:bg-white hover:text-rose-500"
              )}
              aria-label="Add to wishlist"
            >
              <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
            </button>

            <button
              onClick={handleViewClick}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-gray-700 flex items-center justify-center transition-all duration-300 shadow-lg hover:bg-white hover:text-emerald-600"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {hasDiscount && (
              <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Sale
              </span>
            )}
            {product.is_new && (
              <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                New
              </span>
            )}
          </div>

          {/* Add to Cart Button - Slides up on hover */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 p-4 transition-all duration-500",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}>
            <button
              onClick={handleAddToCart}
              className={cn(
                "w-full py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2",
                inCart
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-black text-white hover:bg-gray-900"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              {inCart ? 'Added to Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          {/* Brand */}
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-600">
            {product.brand_name || product.brand}
          </span>

          {/* Product Name */}
          <h3
            onClick={handleViewClick}
            className="text-sm font-medium text-gray-900 leading-tight cursor-pointer hover:text-emerald-600 transition-colors line-clamp-2"
          >
            {product.name}
          </h3>

          {/* Color/Variant indicator */}
          {product.colour_name && (
            <div className="flex items-center gap-1.5">
              {product.colour_hex && (
                <span
                  className="w-3 h-3 rounded-full border border-gray-200"
                  style={{ backgroundColor: product.colour_hex }}
                />
              )}
              <span className="text-xs text-gray-500">{product.colour_name}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg font-semibold text-gray-900">
              £{price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                £{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default StandardProductCard
