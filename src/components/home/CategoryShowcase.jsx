import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

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

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-[#0a0a0a]">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
        {/* Section Header - Editorial style */}
        <div className="mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
          >
            <div>
              <span className="inline-block text-emerald-400 text-xs font-mono tracking-[0.3em] uppercase mb-4">
                — Collections
              </span>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[0.9]">
                Shop by
                <span className="block font-semibold italic">Category</span>
              </h2>
            </div>
            <p className="text-white/40 text-sm md:text-base max-w-sm leading-relaxed font-light">
              Curated collections of premium golf equipment, designed for players who demand excellence.
            </p>
          </motion.div>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
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
      </div>
    </section>
  )
}

const CategoryCard = ({ category, onClick, size = 'medium' }) => {
  const sizeClasses = {
    large: 'aspect-[4/5] md:aspect-auto md:h-[680px]',
    medium: 'aspect-[16/10] md:h-[330px]',
    wide: 'aspect-[21/9] md:h-[280px]',
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
        <div className="flex items-end justify-between gap-4">
          <h3 className={`text-white font-semibold tracking-tight leading-none transition-transform duration-500 group-hover:translate-x-2 ${
            size === 'large' ? 'text-4xl md:text-6xl lg:text-7xl' :
            size === 'wide' ? 'text-3xl md:text-5xl' :
            'text-2xl md:text-4xl'
          }`}>
            {category.name}
          </h3>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center transition-all duration-500 group-hover:bg-white group-hover:border-white group-hover:scale-110">
            <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-white transition-all duration-500 group-hover:text-black group-hover:rotate-45" />
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
