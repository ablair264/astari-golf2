import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'

const categories = [
  {
    name: 'Grips',
    tagline: 'Feel the difference',
    image: '/images/grips.webp',
    link: '/products?category=grips',
    accent: '#10b981',
  },
  {
    name: 'Bags',
    tagline: 'Carry your game',
    image: '/images/bags.webp',
    link: '/products?category=bags',
    accent: '#3b82f6',
  },
  {
    name: 'Accessories',
    tagline: 'Essential details',
    image: '/images/accessories.webp',
    link: '/products?category=accessories',
    accent: '#f59e0b',
  },
  {
    name: 'Apparel',
    tagline: 'Performance wear',
    image: '/images/apparel.webp',
    link: '/products?category=apparel',
    accent: '#8b5cf6',
  },
]

const CategoryShowcase = () => {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-[#0a0a0a]">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
        {/* Section Header - Editorial style */}
        <div className="mb-10 md:mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6"
          >
            <div>
              <span className="inline-block text-emerald-400 text-[10px] md:text-xs font-mono tracking-[0.2em] md:tracking-[0.3em] uppercase mb-2 md:mb-4">
                — Collections
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-white tracking-tight leading-[0.9]">
                Shop by
                <span className="block font-semibold italic">Category</span>
              </h2>
            </div>
            <p className="text-white/40 text-xs md:text-sm lg:text-base max-w-sm leading-relaxed font-light">
              Curated collections of premium golf equipment, designed for players who demand excellence.
            </p>
          </motion.div>
        </div>

        {/* Mobile: Horizontal Swiper */}
        {isMobile && (
          <div className="md:hidden -mx-4 sm:-mx-6">
            <Swiper
              modules={[Pagination]}
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet !bg-white/30 !w-2 !h-2',
                bulletActiveClass: '!bg-emerald-400 !w-6',
              }}
              slidesPerView={1.2}
              spaceBetween={12}
              centeredSlides
              className="!pb-10 !px-4"
            >
              {categories.map((category, index) => (
                <SwiperSlide key={category.name}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CategoryCard
                      category={category}
                      onClick={() => navigate(category.link)}
                      size="mobile"
                    />
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Desktop: Asymmetric Grid */}
        {!isMobile && (
          <div className="hidden md:grid md:grid-cols-12 gap-4 md:gap-6">
            {/* Large featured card - Grips */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="md:col-span-7 md:row-span-2"
            >
              <CategoryCard
                category={categories[0]}
                onClick={() => navigate(categories[0].link)}
                size="large"
              />
            </motion.div>

            {/* Stacked cards on right */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="md:col-span-5"
            >
              <CategoryCard
                category={categories[1]}
                onClick={() => navigate(categories[1].link)}
                size="medium"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="md:col-span-5"
            >
              <CategoryCard
                category={categories[2]}
                onClick={() => navigate(categories[2].link)}
                size="medium"
              />
            </motion.div>

            {/* Full width bottom card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="md:col-span-12"
            >
              <CategoryCard
                category={categories[3]}
                onClick={() => navigate(categories[3].link)}
                size="wide"
              />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}

const CategoryCard = ({ category, onClick, size = 'medium' }) => {
  const sizeClasses = {
    large: 'aspect-[4/5] md:aspect-auto md:h-[680px]',
    medium: 'aspect-[16/10] md:h-[330px]',
    wide: 'aspect-[21/9] md:h-[280px]',
    mobile: 'aspect-[3/4] h-[320px]',
  }

  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl ${sizeClasses[size]} cursor-pointer`}
    >
      {/* Background Image with Ken Burns effect */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          style={{ backgroundImage: `url(${category.image})` }}
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent opacity-60" />

        {/* Accent color glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
          style={{ background: `radial-gradient(circle at bottom left, ${category.accent}, transparent 70%)` }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-8 lg:p-10">
        {/* Tagline */}
        <span
          className="text-xs font-mono tracking-[0.2em] uppercase mb-2 transition-colors duration-500"
          style={{ color: category.accent }}
        >
          {category.tagline}
        </span>

        {/* Category Name */}
        <div className="flex items-end justify-between gap-3 md:gap-4">
          <h3 className={`text-white font-semibold tracking-tight leading-none transition-transform duration-500 group-hover:translate-x-2 ${
            size === 'large' ? 'text-4xl md:text-6xl lg:text-7xl' :
            size === 'wide' ? 'text-3xl md:text-5xl' :
            size === 'mobile' ? 'text-2xl' :
            'text-2xl md:text-4xl'
          }`}>
            {category.name}
          </h3>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border border-white/20 flex items-center justify-center transition-all duration-500 group-hover:bg-white group-hover:border-white group-hover:scale-110">
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white transition-all duration-500 group-hover:text-black group-hover:rotate-45" />
          </div>
        </div>

        {/* Bottom line accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Corner accent */}
      <div
        className="absolute top-6 right-6 w-2 h-2 rounded-full opacity-60"
        style={{ backgroundColor: category.accent }}
      />
    </button>
  )
}

export default CategoryShowcase
