import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Check,
  Star,
  Truck,
  RotateCcw,
  Shield,
  Minus,
  Plus,
} from 'lucide-react'
import { getProduct, getProductsByCategory } from '@/services/products'
import { useCart, cartUtils } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import ImageGallery from '@/components/product/ImageGallery'
import VariantSelector from '@/components/product/VariantSelector'
import ProductTabs from '@/components/product/ProductTabs'

const ProductDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const { addToCart, isInCart, getCartItem } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { showCartToast } = useToast()

  // Current product to display (selected variant or main product)
  const displayProduct = selectedVariant || product

  const isWishlisted = displayProduct ? isInWishlist(displayProduct.id) : false
  const inCart = displayProduct ? isInCart(displayProduct.id) : false
  const cartItem = displayProduct ? getCartItem(displayProduct.id) : null

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const productData = await getProduct(id)
      setProduct(productData)

      // Get variants if available
      if (productData?.variants) {
        setVariants(productData.variants)
      }

      // Load related products
      if (productData?.category_id) {
        const related = await getProductsByCategory(productData.category_id)
        const filtered = related.filter((p) => p.id !== parseInt(id)).slice(0, 4)
        setRelatedProducts(filtered)
      }
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (displayProduct) {
      addToCart(displayProduct, quantity)
      setAddedToCart(true)

      // Show toast
      showCartToast(
        {
          name: displayProduct.name,
          media: getImageUrl(displayProduct),
          final_price: displayProduct.final_price ?? displayProduct.calculated_price ?? displayProduct.price,
        },
        quantity
      )

      setQuantity(1)
      setTimeout(() => setAddedToCart(false), 2000)
    }
  }

  const handleBuyNow = () => {
    handleAddToCart()
    setTimeout(() => navigate('/checkout'), 300)
  }

  const handleWishlistToggle = () => {
    if (displayProduct) {
      toggleWishlist(displayProduct)
    }
  }

  // Get the image URL
  const getImageUrl = (p) => p?.image_url || p?.media || '/images/placeholder.png'

  // Get all images for gallery
  const getGalleryImages = (p) => {
    const images = []
    if (p?.image_url) images.push(p.image_url)
    if (p?.images && Array.isArray(p.images)) {
      images.push(...p.images.filter((img) => img && img !== p.image_url))
    }
    if (p?.gallery && Array.isArray(p.gallery)) {
      images.push(...p.gallery.filter((img) => img && !images.includes(img)))
    }
    return images.length > 0 ? images : ['/images/placeholder.png']
  }

  // Calculate prices
  const price = parseFloat(displayProduct?.final_price ?? displayProduct?.calculated_price ?? displayProduct?.price ?? 0)
  const originalPrice = displayProduct?.compare_at_price ? parseFloat(displayProduct.compare_at_price) : null
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10" />
              <div className="text-white/50">Loading product...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0e14]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="flex flex-col items-center justify-center h-96">
            <h1 className="text-white text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-white/60 mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/products')} className="bg-emerald-500 hover:bg-emerald-400 text-black">Browse Products</Button>
          </div>
        </div>
      </div>
    )
  }

  const galleryImages = getGalleryImages(displayProduct)

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Navbar />

      {/* Main Content */}
      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-white/50 hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/products" className="text-white/50 hover:text-white transition-colors">
              Products
            </Link>
            {displayProduct.category_name && (
              <>
                <span className="text-white/30">/</span>
                <Link
                  to={`/products?category=${displayProduct.category_id}`}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {displayProduct.category_name}
                </Link>
              </>
            )}
            <span className="text-white/30">/</span>
            <span className="text-white font-medium truncate max-w-[200px]">
              {displayProduct.name}
            </span>
          </nav>
        </div>

        {/* Product Section - Split Layout */}
        <div className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Image Gallery */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ImageGallery images={galleryImages} productName={displayProduct.name} />
            </div>

            {/* Right Column - Product Info */}
            <div className="space-y-6">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-3">
                {displayProduct.brand_logo && (
                  <img
                    src={displayProduct.brand_logo}
                    alt={displayProduct.brand_name}
                    className="h-8 w-auto object-contain"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
                {displayProduct.brand_name && (
                  <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">
                    {displayProduct.brand_name}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                {displayProduct.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-white/20 text-white/20'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-white/60">4.0 (24 reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-emerald-400">
                  {cartUtils.formatPrice(price)}
                </span>
                {originalPrice && (
                  <>
                    <span className="text-xl text-white/40 line-through">
                      {cartUtils.formatPrice(originalPrice)}
                    </span>
                    <span className="px-2.5 py-1 text-sm font-semibold bg-red-500/20 text-red-400 rounded-full">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              {displayProduct.stock_quantity !== undefined && (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      displayProduct.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      displayProduct.stock_quantity > 0 ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {displayProduct.stock_quantity > 0
                      ? displayProduct.stock_quantity < 10
                        ? `Only ${displayProduct.stock_quantity} left in stock`
                        : 'In Stock'
                      : 'Out of Stock'}
                  </span>
                </div>
              )}

              {/* Variant Selectors */}
              {variants.length > 1 && (
                <div className="py-4 border-y border-white/10">
                  <VariantSelector
                    variants={variants}
                    selectedVariant={selectedVariant || product}
                    onSelect={(variant) => setSelectedVariant(variant.id === product.id ? null : variant)}
                  />
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-white/20 rounded-lg bg-white/5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-white font-medium border-x border-white/20">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-white/60 hover:bg-white/10 rounded-r-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={displayProduct.stock_quantity === 0}
                  className={cn(
                    'flex-1 h-12 text-base font-semibold rounded-xl transition-all',
                    addedToCart
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : inCart
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  )}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Added to Cart!
                    </>
                  ) : inCart ? (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      In Cart ({cartItem?.quantity})
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={displayProduct.stock_quantity === 0}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold rounded-xl border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Buy Now
                </Button>

                <Button
                  onClick={handleWishlistToggle}
                  variant="outline"
                  className={cn(
                    'h-12 w-12 rounded-xl border-white/20 bg-transparent',
                    isWishlisted
                      ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                      : 'text-white/60 hover:bg-white/10'
                  )}
                >
                  <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="flex flex-col items-center text-center">
                  <Truck className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <span className="text-xs text-white/70">Free Shipping</span>
                  <span className="text-xs text-white/40">over £50</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <RotateCcw className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <span className="text-xs text-white/70">Easy Returns</span>
                  <span className="text-xs text-white/40">30-day policy</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Shield className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <span className="text-xs text-white/70">Secure Payment</span>
                  <span className="text-xs text-white/40">SSL encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs Section */}
        <div className="container mx-auto px-4 py-12">
          <ProductTabs product={displayProduct} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-[#0f1318] py-16 border-t border-white/5">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-white mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    onClick={() => navigate(`/products/${relatedProduct.id}`)}
                    className="cursor-pointer"
                  >
                    <ProductCard product={relatedProduct} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetailsPage
