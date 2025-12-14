import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, ShoppingCart, Check, Star, ChevronRight } from 'lucide-react'
import { getProduct, getProductsByCategory } from '@/services/products'
import { useCart, cartUtils } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'

const ProductDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)

  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const isWishlisted = product ? isInWishlist(product.id) : false
  const inCart = product ? isInCart(product.id) : false

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const productData = await getProduct(id)
      setProduct(productData)

      if (productData?.category) {
        const related = await getProductsByCategory(productData.category)
        const filtered = related.filter(p => p.id !== id).slice(0, 4)
        setRelatedProducts(filtered)
      }
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      setAddedToCart(true)
      setQuantity(1)

      setTimeout(() => {
        setAddedToCart(false)
      }, 2000)
    }
  }

  const handleWishlistToggle = () => {
    if (product) {
      toggleWishlist(product)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1f26] to-[#252a32]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-lg">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1f26] to-[#252a32]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="flex flex-col items-center justify-center h-96">
            <h1 className="text-white text-2xl font-bold mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
      </div>
    )
  }

  const gallery = product.gallery || [product.media || product.image_url]
  const originalPrice = parseFloat(product.price) * 1.25 // Mock original price
  const discount = 25

  return (
    <div className="min-h-screen bg-black" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      {/* Hero Section with Full-Page Image */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={gallery[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay - darkens towards bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Product Information - Overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="container mx-auto px-4 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Product Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Limited Edition Badge */}
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                  <span className="text-white text-sm font-semibold">Limited Edition</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white text-sm ml-2">4.9 (128)</span>
                  </div>
                </div>

                {/* Product Name */}
                <h1 className="text-5xl lg:text-6xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {product.name}
                </h1>

                {/* Brand & colour */}
                <div className="flex items-center gap-3 text-white/80">
                  {product.brand_logo && (
                    <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/80">
                      <img
                        src={product.brand_logo}
                        alt={product.brand_name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </span>
                  )}
                  {product.brand_name && <span className="uppercase tracking-[0.12em]">{product.brand_name}</span>}
                  {product.style_no && <span className="text-white/60">Style {product.style_no}</span>}
                  {product.colour_hex && (
                    <span className="flex items-center gap-2 text-sm text-white/60">
                      <span className="inline-flex h-3.5 w-3.5 rounded-full border border-black/30" style={{ backgroundColor: product.colour_hex }} />
                      <span className="capitalize">{product.colour_name || 'Colour'}</span>
                    </span>
                  )}
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-bold text-white">
                    {cartUtils.formatPrice(parseFloat(product.price))}
                  </span>
                  <span className="text-2xl text-white/50 line-through">
                    {cartUtils.formatPrice(originalPrice)}
                  </span>
                  <span className="bg-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    Save {discount}%
                  </span>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-white/10 backdrop-blur-md border-0 h-12">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="details" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="care" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">
                      Care
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-4">
                      <p className="text-white/90 text-lg leading-relaxed">
                        {product.description}
                      </p>
                      <ul className="space-y-3 text-white/80">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          Premium materials and construction
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          {product.materials || 'High-quality materials'}
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          Designed for performance and durability
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          Suitable for all skill levels
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                  <TabsContent value="details" className="mt-6">
                    <div className="space-y-3 text-white/80">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span>Brand</span>
                        <span className="font-semibold text-white">{product.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span>Category</span>
                        <span className="font-semibold text-white">{product.category}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span>Materials</span>
                        <span className="font-semibold text-white">{product.materials || 'Premium quality'}</span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="care" className="mt-6">
                    <div className="space-y-3 text-white/80">
                      <p>To maintain the quality of your product:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          Clean regularly with a soft, damp cloth
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          Store in a cool, dry place when not in use
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          Avoid prolonged exposure to direct sunlight
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column - Select Options */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 space-y-6">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Select Options
                  </h3>

                  {/* Color Selection - Mock */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white">Color</label>
                    <div className="flex gap-3">
                      <button className="w-12 h-12 rounded-full bg-black border-2 border-white shadow-lg" />
                      <button className="w-12 h-12 rounded-full bg-white border-2 border-white/30" />
                    </div>
                  </div>

                  {/* Size Selection - Mock */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white">Size</label>
                    <div className="flex gap-2">
                      <button className="px-6 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors">
                        38mm
                      </button>
                      <button className="px-6 py-2 rounded-lg border-2 border-white bg-white/10 text-white font-semibold">
                        42mm
                      </button>
                      <button className="px-6 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors">
                        44mm
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleAddToCart}
                      className={`w-full h-12 text-base font-semibold rounded-xl transition-all ${
                        addedToCart
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : inCart
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-white hover:bg-gray-100 text-black'
                      }`}
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Added to Cart!
                        </>
                      ) : inCart ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          In Cart
                        </>
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        handleAddToCart()
                        setTimeout(() => navigate('/checkout'), 500)
                      }}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold rounded-xl border-white/30 text-white hover:bg-white/10"
                    >
                      Buy Now
                    </Button>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Expandable Information */}
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between py-3 text-white hover:text-emerald-400 transition-colors">
                      <span className="font-medium">Shipping Information</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <Separator className="bg-white/10" />
                    <button className="w-full flex items-center justify-between py-3 text-white hover:text-emerald-400 transition-colors">
                      <span className="font-medium">Return Policy</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <Separator className="bg-white/10" />
                    <button className="w-full flex items-center justify-between py-3 text-white hover:text-emerald-400 transition-colors">
                      <span className="font-medium">Size Guide</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery - At Bottom */}
      {gallery.length > 1 && (
        <div className="bg-black py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'aspect-square rounded-xl overflow-hidden transition-all',
                    selectedImage === index
                      ? 'ring-4 ring-emerald-500 ring-offset-4 ring-offset-black'
                      : 'hover:opacity-75'
                  )}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-gradient-to-b from-black to-[#1a1f26] py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} onClick={() => navigate(`/products/${relatedProduct.id}`)}>
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ProductDetailsPage
