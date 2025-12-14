import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import GridMotionSlim from '@/components/GridMotionSlim'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { getProductsByBrand } from '@/services/products'

// Brand/Collection configurations
const collectionConfig = {
  Astari: {
    name: 'Astari',
    description: 'Premium golf equipment engineered for excellence',
    tagline: 'Precision in Every Grip',
    images: ['/images/grips.webp', '/images/bags.webp', '/images/2.png'],
    color: '#303843',
  },
  Lamkin: {
    name: 'Lamkin',
    description: 'Tour-proven grips trusted by professionals worldwide',
    tagline: 'Feel the Difference',
    images: ['/images/lamkin.jpg', '/images/grips.webp', '/images/3 .png'],
    color: '#1a1f26',
  },
  Iguana: {
    name: 'Iguana',
    description: 'Innovative grip technology for modern players',
    tagline: 'Grip Innovation',
    images: ['/images/grips.webp', '/images/2.png', '/images/bags.webp'],
    color: '#2d3748',
  },
  GripShift: {
    name: 'GripShift',
    description: 'Revolutionary adjustable grip systems',
    tagline: 'Shift Your Game',
    images: ['/images/bags.webp', '/images/lamkin.jpg', '/images/grips.webp'],
    color: '#1e293b',
  },
  Kola: {
    name: 'Kola',
    description: 'Performance grips with distinctive style',
    tagline: 'Stand Out. Play Better.',
    images: ['/images/3 .png', '/images/grips.webp', '/images/lamkin.jpg'],
    color: '#0f172a',
  },
}

const CollectionPage = ({ brand = 'Astari' }) => {
  const config = collectionConfig[brand] || collectionConfig.Astari
  const [expandedCardId, setExpandedCardId] = useState(null)
  const [sortBy, setSortBy] = useState('featured')
  const [brandProducts, setBrandProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create grid items by repeating brand images
  const gridItems = Array.from({ length: 28 }, (_, index) => {
    return config.images[index % config.images.length]
  })

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await getProductsByBrand(brand)
        setBrandProducts(data)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [brand])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Slim Hero with GridMotion */}
      <section className="relative h-[40vh] w-full overflow-hidden bg-black">
        {/* GridMotion Background */}
        <div className="absolute inset-0">
          <GridMotionSlim items={gridItems} gradientColor="black" height="40vh" />
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 z-[5]" />

        {/* Top Blur for Navbar */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 via-black/20 to-transparent backdrop-blur-sm z-[5]" />

        {/* Collection Title */}
        <div className="relative z-10 h-full flex items-center justify-center px-8">
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white">
              {config.name}
            </h1>
            <div className="h-px w-32 bg-white/40 mx-auto" />
            <p className="text-xl md:text-2xl text-white/90 font-light tracking-wide">
              {config.tagline}
            </p>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
              {config.description}
            </p>
          </div>
        </div>

        {/* Bottom Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/40 z-[6]" />
      </section>

      {/* Collection Controls */}
      <section className="border-b border-gray-200 bg-white sticky top-[88px] z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 xl:px-24 py-4">
          <div className="flex items-center justify-between">
            {/* Product Count */}
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{brandProducts.length}</span> products
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Filter Button */}
              <Button
                variant="outline"
                className="rounded-full border-gray-300 hover:border-gray-400"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filter
              </Button>

              {/* Sort Button */}
              <Button
                variant="outline"
                className="rounded-full border-gray-300 hover:border-gray-400"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort: {sortBy}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Error loading products</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : brandProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {brandProducts.map((product) => (
                <div key={product.id} className="w-full">
                  <ProductCard
                    product={product}
                    isExpanded={expandedCardId === product.id}
                    onToggleExpand={(shouldExpand) => {
                      setExpandedCardId(shouldExpand ? product.id : null)
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Check back soon for new {brand} products</p>
            </div>
          )}
        </div>
      </section>

      {/* Collection Info Section */}
      <section className="py-16 md:py-20 px-4 md:px-8 lg:px-16 xl:px-24 bg-gray-50">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Brand Story */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                About {config.name}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {config.description}
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                Discover our complete range of premium golf equipment designed to elevate your game.
                Each product is crafted with precision and tested by professionals to ensure
                exceptional performance on every shot.
              </p>
              <Button className="rounded-full px-8 py-6 bg-black text-white hover:bg-gray-800">
                Learn More About {config.name}
              </Button>
            </div>

            {/* Right: Featured Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-200">
              <img
                src={config.images[0]}
                alt={config.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CollectionPage
