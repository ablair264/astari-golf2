import { useEffect, useRef } from 'react'

const brands = [
  { name: 'Lamkin', logo: '/images/brands/lamkin.png' },
  { name: 'Golf Pride', logo: '/images/brands/golf-pride.png' },
  { name: 'SuperStroke', logo: '/images/brands/superstroke.png' },
  { name: 'Titleist', logo: '/images/brands/titleist.png' },
  { name: 'Callaway', logo: '/images/brands/callaway.png' },
  { name: 'TaylorMade', logo: '/images/brands/taylormade.png' },
  { name: 'Ping', logo: '/images/brands/ping.png' },
  { name: 'Cobra', logo: '/images/brands/cobra.png' },
]

const BrandLogosCarousel = () => {
  const scrollRef = useRef(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId
    let scrollPosition = 0
    const scrollSpeed = 0.5

    const animate = () => {
      scrollPosition += scrollSpeed
      // Reset when we've scrolled half the content (since we duplicate it)
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Pause on hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId)
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate)
    }

    scrollContainer.addEventListener('mouseenter', handleMouseEnter)
    scrollContainer.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationId)
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter)
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Duplicate brands for seamless loop
  const duplicatedBrands = [...brands, ...brands]

  return (
    <section className="py-12 md:py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <p className="text-center text-sm text-gray-500 uppercase tracking-wider font-medium mb-8">
          Trusted by Leading Brands
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-12 md:gap-16 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {duplicatedBrands.map((brand, index) => (
          <div
            key={`${brand.name}-${index}`}
            className="flex-shrink-0 flex items-center justify-center h-16 px-6 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-10 md:h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image fails
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <span className="hidden text-xl font-bold text-gray-400 tracking-tight">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BrandLogosCarousel
