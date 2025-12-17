import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StandardProductCard from '@/components/StandardProductCard'
import { cn } from '@/lib/utils'

const FeaturedProducts = ({ products = [], title = 'Featured Products' }) => {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = ['all']
    products.forEach(product => {
      const cat = product.category_name || product.category
      if (cat && !cats.includes(cat)) {
        cats.push(cat)
      }
    })
    return cats.slice(0, 5) // Limit to 5 categories
  }, [products])

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return products.slice(0, 8) // Show max 8 products
    }
    return products
      .filter(p => (p.category_name || p.category)?.toLowerCase() === activeCategory.toLowerCase())
      .slice(0, 8)
  }, [products, activeCategory])

  // Get unique products by style_no
  const uniqueProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const key = product.style_no || product.id
      if (!acc.find(p => (p.style_no || p.id) === key)) {
        acc.push(product)
      }
      return acc
    }, [])
  }, [filteredProducts])

  return (
    <section className="py-20 md:py-28 bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-3 block">
              Curated Selection
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h2>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  activeCategory === category
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Products Grid */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {uniqueProducts.map((product, index) => (
            <StandardProductCard
              key={product.style_no || product.id}
              product={product}
              index={index}
            />
          ))}
        </motion.div>

        {/* Empty State */}
        {uniqueProducts.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No products found in this category
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-gray-800 transition-all duration-300 group"
          >
            View All Products
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProducts
