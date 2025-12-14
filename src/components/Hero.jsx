import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import GridMotion from './GridMotion'
import { Button } from '@/components/ui/button'

const heroSlides = [
  {
    layout: 'centered', // Black Friday Sale - centered, bold
    heading: 'BLACK FRIDAY',
    subheading: 'SALE',
    tagline: 'Exclusive deals on premium golf equipment',
    badge: 'Limited Time Only',
    cta1: 'Shop Sale',
    cta2: 'View Deals',
  },
  {
    layout: 'product', // Lamkin Feature - with product image
    heading: '2024 FEATURED',
    subheading: 'GOLF GRIPS',
    tagline: 'Play with more power and precision',
    description: 'Introducing new swing and putter grips: Sonar+ Hero and Deep Etched Sink Fit.',
    productImage: '/lamkin.png',
    cta1: 'Shop Lamkin',
    cta2: 'Learn More',
  },
  {
    layout: 'promo', // Newsletter Promo - discount focused
    heading: 'SAVE 20% OFF',
    subheading: 'Astari Cord Grip',
    tagline: 'Sign up to our newsletter and get instant savings',
    badge: '20% OFF',
    cta1: 'Subscribe Now',
    cta2: 'Shop Grips',
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
      <div className="relative z-10 h-full flex items-center px-8 md:px-16 lg:px-24">
        {/* Layout 1: Centered (Black Friday Sale) */}
        {currentSlideData.layout === 'centered' && (
          <div className="max-w-5xl mx-auto w-full text-center">
            {/* Badge */}
            {currentSlideData.badge && (
              <div ref={headingRef} className="mb-6">
                <span className="inline-block px-6 py-2 rounded-full bg-red-600 text-white text-sm font-bold uppercase tracking-wider">
                  {currentSlideData.badge}
                </span>
              </div>
            )}

            {/* Main Heading */}
            <div ref={subheadingRef} className="space-y-4 mb-8">
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white">
                {currentSlideData.heading}
              </h1>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white/90">
                {currentSlideData.subheading}
              </h2>
            </div>

            {/* Tagline */}
            <p ref={taglineRef} className="text-xl md:text-2xl text-white/80 font-light mb-10">
              {currentSlideData.tagline}
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/products')}
                className="rounded-full px-12 py-6 bg-white text-black hover:bg-white/90 transition-all duration-300 font-semibold text-lg"
              >
                {currentSlideData.cta1}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/products')}
                className="rounded-full px-12 py-6 border-2 border-white bg-transparent text-white hover:bg-white/10 transition-all duration-300 font-semibold text-lg"
              >
                {currentSlideData.cta2}
              </Button>
            </div>
          </div>
        )}

        {/* Layout 2: Product (Lamkin Grips with Image) */}
        {currentSlideData.layout === 'product' && (
          <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <div ref={headingRef} className="space-y-3">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
                  {currentSlideData.heading}
                </h1>
                <div className="h-px w-24 bg-white/40" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-widest text-white/90">
                  {currentSlideData.subheading}
                </h2>
              </div>

              <p ref={subheadingRef} className="text-2xl md:text-3xl text-white font-semibold">
                {currentSlideData.tagline}
              </p>

              <p ref={taglineRef} className="text-base md:text-lg text-white/80 font-light leading-relaxed">
                {currentSlideData.description}
              </p>

              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/products')}
                  className="rounded-full px-10 bg-white text-black hover:bg-white/90 transition-all duration-300 font-medium"
                >
                  {currentSlideData.cta1}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="rounded-full px-10 border-white bg-transparent text-white hover:bg-white/10 transition-all duration-300 font-medium"
                >
                  {currentSlideData.cta2}
                </Button>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <img
                src={currentSlideData.productImage}
                alt="Product"
                className="w-full h-auto object-contain max-h-[400px]"
              />
            </div>
          </div>
        )}

        {/* Layout 3: Promo (Newsletter Discount) */}
        {currentSlideData.layout === 'promo' && (
          <div className="max-w-4xl mx-auto w-full text-center">
            {/* Large Discount Badge */}
            <div ref={headingRef} className="mb-8">
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-red-600 rounded-full blur-2xl opacity-50" />
                <div className="relative bg-red-600 text-white px-12 py-6 rounded-full">
                  <span className="text-6xl md:text-7xl font-bold">{currentSlideData.badge}</span>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div ref={subheadingRef} className="space-y-4 mb-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
                {currentSlideData.heading}
              </h1>
              <h2 className="text-3xl md:text-4xl font-light text-white/90">
                {currentSlideData.subheading}
              </h2>
            </div>

            {/* Tagline */}
            <p ref={taglineRef} className="text-lg md:text-xl text-white/80 font-light mb-10">
              {currentSlideData.tagline}
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/products')}
                className="rounded-full px-12 py-6 bg-red-600 text-white hover:bg-red-700 transition-all duration-300 font-semibold text-lg shadow-lg shadow-red-600/50"
              >
                {currentSlideData.cta1}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/products')}
                className="rounded-full px-12 py-6 border-2 border-white bg-transparent text-white hover:bg-white/10 transition-all duration-300 font-semibold text-lg"
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
