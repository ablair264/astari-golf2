import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ArrowRight, Play, CheckCircle, Truck } from 'lucide-react'

const heroSlides = [
  {
    eyebrow: 'Premium Golf Equipment',
    heading: 'Elevate Your',
    headingAccent: 'Game',
    tagline: 'Discover our curated collection of premium grips, accessories, and equipment from the world\'s leading brands.',
    cta1: 'Explore Products',
    cta1Link: '/products',
    cta2: 'Watch Film',
    cta2Link: null,
  },
  {
    eyebrow: 'Featured Collection',
    heading: 'Golf Grips',
    headingAccent: 'Redefined',
    tagline: 'From tour-proven cord grips to innovative multi-compound designs, find the perfect grip for your game.',
    cta1: 'Shop Grips',
    cta1Link: '/products?category=grips',
    cta2: 'Learn More',
    cta2Link: '/products',
  },
  {
    eyebrow: 'Exclusive Offer',
    heading: 'Join the',
    headingAccent: 'Club',
    badge: '10% OFF',
    tagline: 'Subscribe to our newsletter for exclusive offers, new arrivals, and expert tips.',
    cta1: 'Subscribe Now',
    cta1Link: '/products',
    cta2: 'Shop Now',
    cta2Link: '/products',
  },
]

const HeroApex = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const contentRef = useRef(null)

  // Cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out animation
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
          },
        })
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  // Fade in when slide changes
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
    }
  }, [currentSlide])

  const currentSlideData = heroSlides[currentSlide]

  return (
    <div className="relative w-full h-[600px] md:h-[750px] overflow-hidden rounded-b-3xl md:rounded-b-[4rem]">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full bg-slate-900">
        <div
          className="w-full h-full bg-center bg-cover bg-no-repeat opacity-50 mix-blend-overlay"
          style={{backgroundImage: 'url("/images/grips.webp")'}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6 md:px-20 max-w-5xl mx-auto pt-20"
      >
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
            {currentSlideData.eyebrow}
          </span>
        </span>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
          {currentSlideData.heading}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
            {currentSlideData.headingAccent}
          </span>
          {currentSlideData.badge && (
            <span className="ml-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-white text-lg md:text-xl font-bold align-middle">
              {currentSlideData.badge}
            </span>
          )}
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-2xl text-slate-200 max-w-2xl mb-10 font-light leading-relaxed">
          {currentSlideData.tagline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => currentSlideData.cta1Link && navigate(currentSlideData.cta1Link)}
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-base font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {currentSlideData.cta1}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => currentSlideData.cta2Link && navigate(currentSlideData.cta2Link)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white text-base font-bold rounded-full transition-all duration-300"
          >
            <Play className="w-5 h-5 fill-white" />
            {currentSlideData.cta2}
          </button>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-10 left-10 md:left-20 hidden md:flex items-center gap-6 text-white/60 text-sm font-medium tracking-wide">
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Premium Quality
        </span>
        <span className="w-1 h-1 bg-white/20 rounded-full" />
        <span className="flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Free Shipping
        </span>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 right-10 md:right-20 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-emerald-400'
                : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroApex
