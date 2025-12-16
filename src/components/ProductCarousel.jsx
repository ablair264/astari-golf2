import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from './ProductCard'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ProductCarousel = ({ products, title = 'Recent Products' }) => {
  const [activeCategory, setActiveCategory] = useState('Grips')
  const [isAutoplayActive, setIsAutoplayActive] = useState(true)
  const [hasExpandedCard, setHasExpandedCard] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState(null)
  const scrollRef = useRef(null)
  const autoplayTimerRef = useRef(null)

  const categories = ['Grips', 'Bags', 'Clubs', 'Balls']

  // Filter products by category (normalize to category_name from the query)
  const filteredProducts = products.filter((product) => {
    const category =
      product.category_name ||
      product.category ||
      product.category_slug ||
      ''
    return category.toLowerCase() === activeCategory.toLowerCase()
  })

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 390 // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      // Pause autoplay on manual scroll, resume after 5 seconds
      setIsAutoplayActive(false)
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current)
      }
      autoplayTimerRef.current = setTimeout(() => {
        setIsAutoplayActive(true)
      }, 5000)
    }
  }

  // Autoplay effect
  useEffect(() => {
    if (!isAutoplayActive || hasExpandedCard || !scrollRef.current) return

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current
        const maxScroll = container.scrollWidth - container.clientWidth
        const currentScroll = container.scrollLeft

        // If at the end, scroll back to start
        if (currentScroll >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          // Scroll to next card
          container.scrollBy({ left: 390, behavior: 'smooth' })
        }
      }
    }, 3000) // Auto-scroll every 3 seconds

    return () => clearInterval(interval)
  }, [isAutoplayActive, hasExpandedCard, activeCategory])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current)
      }
    }
  }, [])

  return (
    <section className="w-full py-12 md:py-20 px-4 md:px-8 lg:px-16 xl:px-24 bg-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-14">
          {/* Title */}
          <h2 className="text-xl md:text-2xl font-semibold text-zinc-900">
            {title}
          </h2>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'px-3 md:px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-300',
                  activeCategory === category
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-zinc-900 hover:bg-gray-300'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons - Hidden on mobile */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-900" />
          </button>

          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Next products"
          >
            <ChevronRight className="w-5 h-5 text-zinc-900" />
          </button>

          {/* Products Scroll Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 md:gap-12 overflow-x-auto scrollbar-hide scroll-smooth pb-6 group -mx-4 px-4 md:mx-0 md:px-0 md:pr-24"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <AnimatePresence mode="wait">
              {filteredProducts.length > 0 ? (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex gap-6 md:gap-12"
                >
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: 'easeOut'
                      }}
                      className="flex-shrink-0"
                    >
                      <ProductCard
                        product={product}
                        isExpanded={expandedCardId === product.id}
                        onToggleExpand={(shouldExpand) => {
                          // If expanding, set this card as expanded; if collapsing, clear expanded card
                          const newExpandedId = shouldExpand ? product.id : null
                          setExpandedCardId(newExpandedId)
                          setHasExpandedCard(shouldExpand)

                          if (shouldExpand) {
                            // Auto-scroll carousel to ensure expanded card is visible
                            setTimeout(() => {
                              if (scrollRef.current) {
                                const container = scrollRef.current
                                const cardElement = container.children[0]?.children[index]

                                if (cardElement) {
                                  // Get container dimensions
                                  const containerRect = container.getBoundingClientRect()
                                  const expandedWidth = 920
                                  const cardLeft = cardElement.offsetLeft
                                  const containerWidth = containerRect.width
                                  const currentScroll = container.scrollLeft

                                  // Calculate how much of the card is visible on the right
                                  const cardRight = cardLeft + expandedWidth
                                  const visibleRight = currentScroll + containerWidth

                                  // If card extends beyond visible area, scroll to show it
                                  if (cardRight > visibleRight) {
                                    // Scroll so the card's right edge is visible with padding
                                    const targetScroll = cardRight - containerWidth + 60 // 60px right padding
                                    container.scrollTo({
                                      left: Math.max(0, targetScroll),
                                      behavior: 'smooth'
                                    })
                                  } else if (cardLeft < currentScroll) {
                                    // If card's left edge is cut off, scroll to show it
                                    container.scrollTo({
                                      left: Math.max(0, cardLeft - 60), // 60px left padding
                                      behavior: 'smooth'
                                    })
                                  }
                                }
                              }
                            }, 100) // Small delay to let the card expand first
                          }
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center py-12 text-gray-500"
                >
                  No products found in this category
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductCarousel
