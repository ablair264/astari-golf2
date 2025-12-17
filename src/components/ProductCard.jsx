import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Heart, X, Plus, Minus, ShoppingBag, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/contexts/ToastContext'

const ProductCard = ({ product, isExpanded = false, onToggleExpand, variants = [] }) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [justAdded, setJustAdded] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)

  const { addToCart, isInCart, getCartItem } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { showCartToast } = useToast()

  // Get the image URL - prefer image_url from database, fallback to media
  const getImageUrl = (p) => p?.image_url || p?.media || '/images/placeholder.png'

  // Get all images for gallery - combine image_url with images array
  const getGalleryImages = (p) => {
    const images = []
    if (p?.image_url) images.push(p.image_url)
    if (p?.images && Array.isArray(p.images)) {
      images.push(...p.images.filter(img => img && img !== p.image_url))
    }
    if (p?.gallery && Array.isArray(p.gallery)) {
      images.push(...p.gallery.filter(img => img && !images.includes(img)))
    }
    return images.length > 0 ? images : []
  }

  // Current product to display (selected variant or main product)
  const displayProduct = selectedVariant || product
  const currentImageUrl = getImageUrl(displayProduct)
  const galleryImages = getGalleryImages(displayProduct)

  // Check if product is in wishlist
  const isWishlisted = isInWishlist(displayProduct.id)

  // Check if product is in cart
  const inCart = isInCart(displayProduct.id)
  const cartItem = getCartItem(displayProduct.id)

  // Reset selected variant when card collapses
  useEffect(() => {
    if (!isExpanded) {
      setSelectedVariant(null)
    }
  }, [isExpanded])

  // Reset "just added" state after animation
  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => setJustAdded(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [justAdded])

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
    toggleWishlist(displayProduct)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(displayProduct, quantity)
    setJustAdded(true)
    // Reset quantity after adding to cart
    setQuantity(1)
    // Show toast notification
    showCartToast({
      name: displayProduct.name,
      media: currentImageUrl,
      final_price: displayProduct.final_price ?? displayProduct.calculated_price ?? displayProduct.price,
    }, quantity)
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
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{ backgroundImage: `url(${currentImageUrl})` }}
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
                {product.brand_name || product.brand}
              </span>
              <span className="block text-white text-2xl font-bold drop-shadow-lg leading-tight">
                {product.name}
              </span>
            </div>

            {/* Collapsed View - Bottom Section - Price & Actions */}
            <div className="flex justify-between items-center">
              {/* Price */}
              <span className="text-white text-3xl font-medium drop-shadow-lg">
                £{Number(product.final_price ?? product.calculated_price ?? product.price).toFixed(2)}
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
            <div className="relative w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={handleCollapse}
                className="absolute top-0 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-sm z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Left Section - Product Info */}
              <div className="flex-1 flex flex-col gap-3 md:gap-4 min-w-0">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">
                      {displayProduct.brand_name || displayProduct.brand}
                    </span>
                    {displayProduct.category_name && (
                      <>
                        <span className="text-white/30">·</span>
                        <span className="text-gray-400 text-xs">{displayProduct.category_name}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-white text-xl md:text-2xl font-bold leading-tight pr-12">
                    {displayProduct.name}
                  </h2>
                  <div className="flex items-baseline gap-3">
                    <span className="text-white text-2xl md:text-3xl font-medium">
                      £{Number(displayProduct.final_price ?? displayProduct.calculated_price ?? displayProduct.price).toFixed(2)}
                    </span>
                    {displayProduct.sku && (
                      <span className="text-white/40 text-xs font-mono">SKU: {displayProduct.sku}</span>
                    )}
                  </div>
                </div>

                {/* Product Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {displayProduct.colour_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/50">Colour:</span>
                      <div className="flex items-center gap-1.5">
                        {displayProduct.colour_hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-white/30"
                            style={{ backgroundColor: displayProduct.colour_hex }}
                          />
                        )}
                        <span className="text-white">{displayProduct.colour_name}</span>
                      </div>
                    </div>
                  )}
                  {displayProduct.size && (
                    <div>
                      <span className="text-white/50">Size:</span>{' '}
                      <span className="text-white">{displayProduct.size}</span>
                    </div>
                  )}
                  {displayProduct.material && (
                    <div>
                      <span className="text-white/50">Material:</span>{' '}
                      <span className="text-white">{displayProduct.material}</span>
                    </div>
                  )}
                  {displayProduct.core_size && (
                    <div>
                      <span className="text-white/50">Core Size:</span>{' '}
                      <span className="text-white">{displayProduct.core_size}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {displayProduct.description && (
                  <div className="space-y-1">
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed line-clamp-3">
                      {displayProduct.description}
                    </p>
                  </div>
                )}

                {/* Variants Section */}
                {variants && variants.length > 1 && (
                  <div className="space-y-2">
                    <h3 className="text-white text-xs font-semibold uppercase tracking-wider">
                      Available Options ({variants.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedVariant(variant.id === displayProduct.id ? null : variant)
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all",
                            variant.id === displayProduct.id
                              ? "bg-white text-black"
                              : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                          )}
                        >
                          {variant.colour_hex && (
                            <span
                              className="w-3 h-3 rounded-full border border-white/30"
                              style={{ backgroundColor: variant.colour_hex }}
                            />
                          )}
                          <span>{variant.colour_name || variant.size || `Variant ${variant.id}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Section */}
                <div className="flex items-center gap-2 mt-auto pt-2">
                  {/* Quantity Selector */}
                  <ButtonGroup onClick={(e) => e.stopPropagation()}>
                    <Button
                      disabled={quantity === 1}
                      onClick={() => handleQuantityChange(-1)}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 rounded-l-lg rounded-r-none border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <ButtonGroupText className="h-9 min-w-10 text-sm">
                      {quantity}
                    </ButtonGroupText>
                    <Button
                      onClick={() => handleQuantityChange(1)}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 rounded-r-lg rounded-l-none border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </ButtonGroup>

                  {/* Add to Cart Button */}
                  <Button
                    className={cn(
                      "flex-1 rounded-full h-9 text-xs font-semibold transition-all",
                      justAdded
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : inCart
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-white text-black hover:bg-white/90"
                    )}
                    onClick={handleAddToCart}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Added!
                      </>
                    ) : inCart ? (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        In Cart ({cartItem?.quantity})
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        Add to Cart
                      </>
                    )}
                  </Button>

                  <button
                    onClick={handleWishlistClick}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-sm flex-shrink-0',
                      isWishlisted
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-white/20 hover:bg-white/30'
                    )}
                    aria-label="Add to wishlist"
                  >
                    <Heart className={cn('w-4 h-4 text-white', isWishlisted && 'fill-current')} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/products/${displayProduct.id}`)
                    }}
                    className="h-9 px-3 rounded-full bg-white/20 hover:bg-white/30 flex items-center gap-1.5 transition-all backdrop-blur-sm flex-shrink-0"
                    aria-label="View full details"
                  >
                    <span className="text-white text-xs font-medium">View</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Right Section - Image Gallery */}
              <div className="md:w-56 flex-shrink-0">
                <div className="space-y-2">
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Images</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {galleryImages.length > 0 ? (
                      galleryImages.slice(0, 4).map((image, index) => (
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
                            alt={`${displayProduct.name} view ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))
                    ) : (
                      // Show main product image if no gallery
                      currentImageUrl ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(currentImageUrl)
                          }}
                          className="aspect-square rounded-lg overflow-hidden bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 col-span-2"
                        >
                          <img
                            src={currentImageUrl}
                            alt={displayProduct.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center col-span-2">
                          <Eye className="w-8 h-8 text-white/40" />
                        </div>
                      )
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
