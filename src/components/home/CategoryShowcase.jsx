import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const categories = [
  {
    name: 'Grips',
    description: 'Premium golf grips for every style',
    image: '/images/grips.webp',
    link: '/products?category=grips',
    featured: true,
  },
  {
    name: 'Bags',
    description: 'Stand, cart & travel bags',
    image: '/images/bags.webp',
    link: '/products?category=bags',
  },
  {
    name: 'Accessories',
    description: 'Gloves, towels & more',
    image: '/images/accessories.webp',
    link: '/products?category=accessories',
  },
  {
    name: 'Apparel',
    description: 'Performance golf wear',
    image: '/images/apparel.webp',
    link: '/products?category=apparel',
  },
]

const CategoryShowcase = () => {
  const navigate = useNavigate()

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-emerald-600 text-sm font-medium tracking-wider uppercase">
            Browse Collection
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
            Shop by Category
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Explore our curated selection of premium golf equipment and accessories
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <button
              key={category.name}
              onClick={() => navigate(category.link)}
              className={`group relative overflow-hidden rounded-2xl bg-gray-100 transition-all duration-500 hover:shadow-2xl ${
                category.featured ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              style={{ aspectRatio: category.featured ? '1/1' : '4/3' }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                  <h3 className={`text-white font-bold ${
                    category.featured ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
                  }`}>
                    {category.name}
                  </h3>
                  <p className="text-white/70 mt-1 text-sm md:text-base">
                    {category.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryShowcase
