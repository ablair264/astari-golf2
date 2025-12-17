import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { cn } from '@/lib/utils'

const ApexProductCard = ({ product }) => {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const isWishlisted = isInWishlist(product.id)

  // Get the display price
  const displayPrice = product.final_price || product.calculated_price || product.price || 0
  const originalPrice = product.original_price || (product.is_special_offer ? product.calculated_price : null)
  const hasDiscount = originalPrice && originalPrice > displayPrice

  // Get image URL
  const imageUrl = product.primary_image || product.image_url || product.media || '/products/1.png'

  // Get category name
  const category = product.category_name || product.category || 'Golf Equipment'

  // Get brand name
  const brand = product.brand_name || product.brand || 'ASTARI'

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addItem({
      id: product.id,
      name: product.name,
      price: displayPrice,
      image: imageUrl,
      quantity: 1,
      sku: product.sku,
    })
  }

  const handleToggleWishlist = (e) => {
    e.stopPropagation()
    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const handleClick = () => {
    navigate(`/products/${product.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="snap-center flex flex-col w-[280px] md:w-[320px] rounded-xl bg-white shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group overflow-hidden border border-slate-100 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
        {/* Badge */}
        {(product.is_special_offer || hasDiscount) && (
          <div className="absolute top-4 left-4 z-10">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm bg-red-500 text-white">
              SALE
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={cn(
            "absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300",
            isWishlisted
              ? "bg-red-500 text-white opacity-100"
              : "bg-white/10 text-white hover:bg-emerald-500 hover:text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
          )}
        >
          <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
        </button>

        {/* Product Image */}
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div className="space-y-1">
          {/* Category & Rating Row */}
          <div className="flex justify-between items-start">
            <p className="text-emerald-600 text-xs font-medium uppercase tracking-wider">
              {category}
            </p>
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < 4 ? "fill-yellow-400" : "fill-none"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-slate-900 text-xl font-bold leading-tight group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>

          {/* Brand */}
          <p className="text-slate-400 text-sm">{brand}</p>

          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            <p className="text-emerald-600 text-lg font-bold leading-normal">
              ${Number(displayPrice).toFixed(2)}
            </p>
            {hasDiscount && (
              <p className="text-slate-400 text-sm line-through">
                ${Number(originalPrice).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-11 px-6 bg-slate-900 text-white text-sm font-bold tracking-wide hover:bg-emerald-600 transition-colors active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  )
}

export default ApexProductCard
