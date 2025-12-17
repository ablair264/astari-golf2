import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import GridMotion from './GridMotion'
import { Button } from '@/components/ui/button'

const heroSlides = [
  {
    layout: 'hero', // Main hero - clean, impactful
    eyebrow: 'Premium Golf Equipment',
    heading: 'Elevate Your Game',
    subheading: 'with ASTARI',
    tagline: 'Discover our curated collection of premium grips, accessories, and equipment from the world\'s leading brands.',
    cta1: 'Shop Collection',
    cta2: 'View Brands',
  },
  {
    layout: 'product', // Featured product
    eyebrow: 'Featured Collection',
    heading: 'Golf Grips',
    subheading: 'Performance Redefined',
    tagline: 'Enhanced feel. Superior control. Maximum performance.',
    description: 'From tour-proven cord grips to innovative multi-compound designs, find the perfect grip for your game.',
    productImage: '/lamkin.png',
    cta1: 'Shop Grips',
    cta2: 'Learn More',
  },
  {
    layout: 'promo', // Newsletter/Promo
    eyebrow: 'Exclusive Offer',
    heading: 'Join the Club',
    badge: '10% OFF',
    tagline: 'Subscribe to our newsletter for exclusive offers, new arrivals, and expert tips.',
    cta1: 'Subscribe Now',
    cta2: 'Shop Now',
  },
]

const Hero = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const headingRef = useRef(null)
  const subheadingRef = useRef(null)
  const taglineRef = useRef(null)
  const ctaRef = useRef(null)

  // Array of images from your public/images folder - 28 items for 4x7 grid
  const baseImages = [
    '/images/grips.webp',
    '/images/bags.webp',
    '/images/lamkin.jpg',
    '/images/2.png',
    '/images/3 .png',
  ]

  // Create 28 items by repeating the base images
  const gridItems = Array.from({ length: 28 }, (_, index) => {
    return baseImages[index % baseImages.length]
  })

  // Initial animation on mount
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(
      headingRef.current,
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, delay: 0.5 }
    )
    .fromTo(
      subheadingRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1 },
      '-=0.6'
    )
    .fromTo(
      taglineRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1 },
      '-=0.6'
    )
    .fromTo(
      ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.4'
    )
  }, [])

  // Cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out animation
      const tl = gsap.timeline({
        onComplete: () => {
          // Change to next slide
          setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
        },
      })

      tl.to([headingRef.current, subheadingRef.current, taglineRef.current, ctaRef.current], {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: 'power2.in',
        stagger: 0.1,
      })
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Fade in when slide changes
  useEffect(() => {
    if (currentSlide === 0) return // Skip on initial load

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(
      headingRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8 }
    )
    .fromTo(
      subheadingRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.6'
    )
    .fromTo(
      taglineRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.6'
    )
    .fromTo(
      ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.6'
    )
  }, [currentSlide])

  const currentSlideData = heroSlides[currentSlide]

  return (
    <section className="relative h-[75vh] w-full overflow-hidden bg-black">
      {/* GridMotion Background */}
      <div className="absolute inset-0">
        <GridMotion items={gridItems} gradientColor="black" />
      </div>

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/60 z-[5]" />

      {/* Top Blur Overlay for Navbar Readability */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 via-black/20 to-transparent backdrop-blur-sm z-[5]" />

      {/* Overlay Content - Different Layouts */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-20">
        {/* Layout 1: Hero - Clean, impactful main slide */}
        {currentSlideData.layout === 'hero' && (
          <div className="max-w-6xl mx-auto w-full">
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <div ref={headingRef}>
                <span className="inline-block text-emerald-400 text-sm md:text-base font-medium tracking-[0.2em] uppercase mb-4">
                  {currentSlideData.eyebrow}
                </span>
              </div>

              {/* Main Heading */}
              <div ref={subheadingRef} className="mb-6">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                  {currentSlideData.heading}
                </h1>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-white/80 mt-2">
                  {currentSlideData.subheading}
                </h2>
              </div>

              {/* Tagline */}
              <p ref={taglineRef} className="text-base md:text-lg text-white/70 font-light leading-relaxed mb-8 max-w-lg">
                {currentSlideData.tagline}
              </p>

              {/* CTAs */}
              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/products')}
                  className="rounded-full px-8 py-5 bg-white text-black hover:bg-white/90 transition-all duration-300 font-medium text-sm tracking-wide"
                >
                  {currentSlideData.cta1}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="rounded-full px-8 py-5 border border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-medium text-sm tracking-wide backdrop-blur-sm"
                >
                  {currentSlideData.cta2}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Layout 2: Product - Featured collection with image */}
        {currentSlideData.layout === 'product' && (
          <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-5">
              {/* Eyebrow */}
              <div ref={headingRef}>
                <span className="inline-block text-emerald-400 text-sm font-medium tracking-[0.2em] uppercase">
                  {currentSlideData.eyebrow}
                </span>
              </div>

              {/* Heading */}
              <div ref={subheadingRef}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {currentSlideData.heading}
                </h1>
                <div className="flex items-center gap-4 mt-3">
                  <div className="h-px w-12 bg-emerald-400/50" />
                  <h2 className="text-xl md:text-2xl font-light text-white/70 tracking-wide">
                    {currentSlideData.subheading}
                  </h2>
                </div>
              </div>

              {/* Tagline */}
              <p ref={taglineRef} className="text-lg md:text-xl text-white/90 font-medium">
                {currentSlideData.tagline}
              </p>

              {/* Description */}
              <p className="text-sm md:text-base text-white/60 font-light leading-relaxed max-w-md">
                {currentSlideData.description}
              </p>

              {/* CTAs */}
              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate('/products?category=grips')}
                  className="rounded-full px-8 py-5 bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-300 font-medium text-sm"
                >
                  {currentSlideData.cta1}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="rounded-full px-8 py-5 border border-white/30 bg-white/5 text-white hover:bg-white/10 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
                >
                  {currentSlideData.cta2}
                </Button>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl blur-3xl" />
              <img
                src={currentSlideData.productImage}
                alt="Product"
                className="relative w-full h-auto object-contain max-h-[380px] drop-shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Layout 3: Promo - Newsletter signup */}
        {currentSlideData.layout === 'promo' && (
          <div className="max-w-4xl mx-auto w-full text-center">
            {/* Eyebrow */}
            <div ref={headingRef}>
              <span className="inline-block text-emerald-400 text-sm font-medium tracking-[0.2em] uppercase mb-4">
                {currentSlideData.eyebrow}
              </span>
            </div>

            {/* Badge + Heading */}
            <div ref={subheadingRef} className="mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
                  {currentSlideData.heading}
                </h1>
                {currentSlideData.badge && (
                  <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-white text-lg md:text-xl font-bold">
                    {currentSlideData.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Tagline */}
            <p ref={taglineRef} className="text-base md:text-lg text-white/70 font-light mb-8 max-w-xl mx-auto">
              {currentSlideData.tagline}
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/products')}
                className="rounded-full px-10 py-5 bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-300 font-medium text-sm shadow-lg shadow-emerald-500/30"
              >
                {currentSlideData.cta1}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/products')}
                className="rounded-full px-10 py-5 border border-white/30 bg-white/5 text-white hover:bg-white/10 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
              >
                {currentSlideData.cta2}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Bottom Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/40 z-[6]" />
    </section>
  )
}

export default Hero
