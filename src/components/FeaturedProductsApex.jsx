import { useRef, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, FreeMode } from 'swiper/modules'
import ApexProductCard from './ApexProductCard'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/free-mode'

const FeaturedProductsApex = ({ products = [], title = 'New Arrivals' }) => {
  const navigate = useNavigate()
  const swiperRef = useRef(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

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

  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-20 pt-12 md:pt-16 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-6 md:w-8 bg-emerald-500" />
            <span className="text-emerald-500 text-xs md:text-sm font-bold tracking-widest uppercase">
              {title}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-slate-900">
            Pro-Level Performance
          </h2>
          <p className="text-slate-500 text-sm md:text-lg mt-1 md:mt-2 max-w-lg font-light">
            Discover the latest technology engineered to perfect your swing and lower your score.
          </p>
        </div>

        {/* Navigation Arrows - Hidden on mobile, touch swipe instead */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous"
            disabled={isBeginning}
            className={`group flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 cursor-pointer ${
              isBeginning
                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${isBeginning ? '' : 'group-hover:-translate-x-0.5'} transition-transform`} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next"
            disabled={isEnd}
            className={`group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 cursor-pointer shadow-lg ${
              isEnd
                ? 'bg-slate-400 shadow-slate-400/10 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-emerald-600 shadow-slate-900/10'
            }`}
          >
            <ArrowRight className={`w-5 h-5 text-white ${isEnd ? '' : 'group-hover:translate-x-0.5'} transition-transform`} />
          </button>
        </div>
      </section>

      {/* Products Carousel with Swiper */}
      <div className="w-full relative pb-8 md:pb-12 max-w-[1440px] mx-auto">
        {/* Left Gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none hidden md:block" />

        <Swiper
          modules={[Navigation, FreeMode]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning)
            setIsEnd(swiper.isEnd)
          }}
          onReachBeginning={() => setIsBeginning(true)}
          onReachEnd={() => setIsEnd(true)}
          slidesPerView="auto"
          spaceBetween={16}
          freeMode={{
            enabled: true,
            momentum: true,
            momentumRatio: 0.5,
          }}
          breakpoints={{
            640: { spaceBetween: 20 },
            768: { spaceBetween: 24 },
          }}
          className="!px-4 sm:!px-6 md:!px-12 lg:!px-20 !overflow-visible"
        >
          {uniqueProducts.map((product) => (
            <SwiperSlide key={product.id} className="!w-[260px] sm:!w-[280px] md:!w-[320px]">
              <ApexProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Right Gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block" />

        {/* Mobile swipe hint */}
        <div className="flex md:hidden justify-center mt-4 text-xs text-slate-400">
          <span>Swipe to explore</span>
        </div>
      </div>

      {/* View All Button */}
      <div className="px-4 pb-16 md:pb-20 flex justify-center">
        <button
          onClick={() => navigate('/products')}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-11 md:h-12 px-8 md:px-10 border border-slate-300 bg-transparent text-slate-900 text-xs md:text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100 transition-colors shadow-sm active:scale-95 uppercase"
        >
          View All Products
        </button>
      </div>
    </div>
  )
}

export default FeaturedProductsApex
