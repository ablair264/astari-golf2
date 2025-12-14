import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Heart, X, Plus, Minus, ShoppingBag, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'

const ProductCard = ({ product, isExpanded = false, onToggleExpand }) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)

  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  // Check if product is in wishlist
  const isWishlisted = isInWishlist(product.id)

  // Check if product is in cart
  const inCart = isInCart(product.id)

  const handleQuantityChange = (change) => {
    setQuantity(Math.max(1, quantity + change))
  }

  const handleCardClick = () => {
    // Toggle expanded state - if currently expanded, collapse; otherwise expand
    if (onToggleExpand) {
      onToggleExpand(!isExpanded)
    }
  }

  const handleCollapse = (e) => {
    e.stopPropagation()
    // Collapse the card
    if (onToggleExpand) {
      onToggleExpand(false)
    }
  }

  const handleWishlistClick = (e) => {
    e.stopPropagation()
    toggleWishlist(product)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(product, quantity)
    // Reset quantity after adding to cart
    setQuantity(1)
  }

  return (
    <div
      className={cn(
        "group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 ease-out",
        isExpanded
          ? "w-[calc(100vw-2rem)] min-w-[calc(100vw-2rem)] h-auto min-h-[480px] md:w-[920px] md:min-w-[920px] md:h-[520px]"
          : "w-full min-w-[340px] max-w-[340px] h-[480px]"
      )}
      onClick={handleCardClick}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => !isExpanded && setIsHovered(false)}
    >
      {/* Background Image/Video */}
      {product.mediaType === 'video' ? (
        <video
          src={product.media}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${product.media})` }}
        />
      )}

      {/* Overlay gradient - darker when expanded */}
      <div className={cn(
        "absolute inset-0 transition-all duration-500",
        isExpanded
          ? "bg-black/70 backdrop-blur-sm"
          : "bg-gradient-to-b from-black/40 via-transparent to-black/60"
      )} />

      {/* Content */}
      <div className={cn(
        "relative w-full h-full flex flex-col justify-between",
        isExpanded ? "p-5 md:p-7" : "p-7"
      )}>
        {!isExpanded ? (
          <>
            {/* Collapsed View - Top Section - Brand & Product Name */}
            <div className="space-y-2">
              <span className="block text-gray-200 text-base font-semibold tracking-wide drop-shadow-lg uppercase">
                {product.brand}
              </span>
              <span className="block text-white text-2xl font-bold drop-shadow-lg leading-tight">
                {product.name}
              </span>
            </div>

            {/* Collapsed View - Bottom Section - Price & Actions */}
            <div className="flex justify-between items-center">
              {/* Price */}
              <span className="text-white text-3xl font-medium drop-shadow-lg">
                £{product.price}
              </span>

              {/* Action Buttons - Always visible */}
              <div className="flex gap-2">
                {/* View Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/products/${product.id}`)
                  }}
                  className="w-10 h-10 rounded-full bg-[#282f38] hover:bg-[#3a4250] flex items-center justify-center transition-all group/btn"
                  aria-label="View details"
                >
                  <Eye className="w-4 h-4 text-white transition-all group-hover/btn:[stroke-width:1.5px]" strokeWidth={1} />
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleWishlistClick}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all group/btn',
                    isWishlisted
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-[#282f38] hover:bg-[#3a4250]'
                  )}
                  aria-label="Add to wishlist"
                >
                  <Heart className={cn('w-4 h-4 text-white transition-all', isWishlisted && 'fill-current', !isWishlisted && 'group-hover/btn:[stroke-width:1.5px]')} strokeWidth={1} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Expanded View */}
            <div className="relative w-full h-full flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Close Button */}
              <button
                onClick={handleCollapse}
                className="absolute top-0 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-sm z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Left Section - Product Info */}
              <div className="flex-1 flex flex-col gap-4 md:gap-5">
                {/* Header */}
                <div className="space-y-2">
                  <span className="block text-gray-200 text-base font-semibold tracking-wide drop-shadow-lg uppercase">
                    {product.brand}
                  </span>
                  <h2 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg leading-tight">
                    {product.name}
                  </h2>
                  <div className="pt-1">
                    <span className="text-white text-3xl md:text-4xl font-medium drop-shadow-lg">
                      £{product.price}
                    </span>
                  </div>
                </div>

                {/* Description & Materials */}
                <div className="space-y-4 flex-1">
                  {product.description && (
                    <div className="space-y-1.5">
                      <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Description</h3>
                      <p className="text-gray-200 text-xs md:text-sm leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {product.materials && (
                    <div className="space-y-1.5">
                      <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Materials</h3>
                      <p className="text-gray-200 text-xs md:text-sm">
                        {product.materials}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Section - All in one line */}
                <div className="flex items-center gap-3 pb-2">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-white text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Quantity</span>
                    <ButtonGroup onClick={(e) => e.stopPropagation()}>
                      <Button
                        disabled={quantity === 1}
                        onClick={() => handleQuantityChange(-1)}
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 rounded-l-lg rounded-r-none border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm disabled:opacity-50"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <ButtonGroupText className="h-10 min-w-14">
                        {quantity}
                      </ButtonGroupText>
                      <Button
                        onClick={() => handleQuantityChange(1)}
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 rounded-r-lg rounded-l-none border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </ButtonGroup>
                  </div>

                  {/* Action Buttons */}
                  <Button
                    className={cn(
                      "flex-1 rounded-full h-10 text-sm font-semibold transition-all",
                      inCart
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-white text-black hover:bg-white/90"
                    )}
                    onClick={handleAddToCart}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <button
                    onClick={handleWishlistClick}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm flex-shrink-0',
                      isWishlisted
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-white/20 hover:bg-white/30'
                    )}
                    aria-label="Add to wishlist"
                  >
                    <Heart className={cn('w-5 h-5 text-white', isWishlisted && 'fill-current')} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/products/${product.id}`)
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-sm flex-shrink-0"
                    aria-label="View full details"
                  >
                    <Eye className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Right Section - Image Gallery */}
              <div className="md:w-64 flex-shrink-0 md:mt-12">
                <div className="space-y-2">
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Product Images</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {product.gallery && product.gallery.length > 0 ? (
                      product.gallery.map((image, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(image)
                          }}
                          className="aspect-square rounded-lg overflow-hidden bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 hover:border-white/40"
                        >
                          <img
                            src={image}
                            alt={`${product.name} view ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))
                    ) : (
                      // Placeholder thumbnails when no gallery images
                      <>
                        {[...Array(4)].map((_, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                          >
                            <Eye className="w-6 h-6 text-white/40" />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(null)
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(null)
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                  aria-label="Close image"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProductCard
