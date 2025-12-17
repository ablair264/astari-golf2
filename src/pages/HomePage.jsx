import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import BrandLogosCarousel from '@/components/home/BrandLogosCarousel'
import ProductCarousel from '@/components/ProductCarousel'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import GripFinderCTA from '@/components/home/GripFinderCTA'
import BentoGrid from '@/components/BentoGrid'
import BrandStory from '@/components/BrandStory'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import TrustBadges from '@/components/home/TrustBadges'
import Newsletter from '@/components/Newsletter'
import InstagramFeed from '@/components/home/InstagramFeed'
import Footer from '@/components/Footer'
import { getAllProducts } from '@/services/products'

const HomePage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await getAllProducts()
        setProducts(data)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading products</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with GridMotion */}
      <Hero />

      {/* Brand Logos Carousel */}
      <BrandLogosCarousel />

      {/* Product Carousel */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="text-gray-500">Loading products...</div>
        </div>
      ) : (
        <ProductCarousel products={products} title="Featured Products" />
      )}

      {/* Category Showcase */}
      <CategoryShowcase />

      {/* GripFinder CTA */}
      <GripFinderCTA />

      {/* Bento Grid Section */}
      <BentoGrid />

      {/* Brand Story Section */}
      <BrandStory />

      {/* Features Section */}
      <Features />

      {/* Second Product Carousel - Different Category */}
      {!loading && <ProductCarousel products={products} title="Best Sellers" />}

      {/* Testimonials Section */}
      <Testimonials />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Newsletter Section */}
      <Newsletter />

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default HomePage
