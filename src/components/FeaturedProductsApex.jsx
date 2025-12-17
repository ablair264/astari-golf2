import { useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ApexProductCard from './ApexProductCard'

const FeaturedProductsApex = ({ products = [], title = 'New Arrivals' }) => {
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  // Get unique products by style_no (first variant of each style)
  const uniqueProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const key = product.style_no || product.id
      if (!acc.find(p => (p.style_no || p.id) === key)) {
        acc.push(product)
      }
      return acc
    }, []).slice(0, 12) // Limit to 12 products
  }, [products])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 340 // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="px-6 md:px-12 lg:px-20 pt-16 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-8 bg-emerald-500" />
            <span className="text-emerald-500 text-sm font-bold tracking-widest uppercase">
              {title}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-slate-900">
            Pro-Level Performance
          </h2>
          <p className="text-slate-500 text-lg mt-2 max-w-lg font-light">
            Discover the latest technology engineered to perfect your swing and lower your score.
          </p>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            aria-label="Previous"
            className="group flex items-center justify-center w-12 h-12 rounded-full border border-slate-300 hover:bg-slate-100 transition-all duration-300 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next"
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 hover:bg-emerald-600 transition-all duration-300 cursor-pointer shadow-lg shadow-slate-900/10"
          >
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Products Carousel */}
      <div className="w-full relative pb-12 overflow-hidden max-w-[1440px] mx-auto">
        {/* Left Gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none md:block hidden" />

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="px-6 md:px-12 lg:px-20 overflow-x-auto no-scrollbar scroll-smooth snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-stretch gap-6 pb-8 min-w-max">
            {uniqueProducts.map((product) => (
              <ApexProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Right Gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none md:block hidden" />
      </div>

      {/* View All Button */}
      <div className="px-4 pb-20 flex justify-center">
        <button
          onClick={() => navigate('/products')}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-10 border border-slate-300 bg-transparent text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100 transition-colors shadow-sm active:scale-95 uppercase tracking-widest"
        >
          View All Products
        </button>
      </div>
    </div>
  )
}

export default FeaturedProductsApex
