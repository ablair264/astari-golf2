import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Star, Quote } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    name: 'James Mitchell',
    role: 'PGA Tour Professional',
    content: 'The feel and control I get from Astari grips is unmatched. They\'ve become an essential part of my competitive edge.',
    rating: 5,
    image: '/images/1.jpg',
  },
  {
    name: 'Sarah Chen',
    role: 'Club Champion',
    content: 'After switching to Astari, my consistency improved dramatically. The all-weather performance is exactly what I needed.',
    rating: 5,
    image: '/images/2.png',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Golf Instructor',
    content: 'I recommend Astari to all my students. The quality and precision in every product shows they truly understand the game.',
    rating: 5,
    image: '/images/4.jpg',
  },
]

const TestimonialCard = ({ testimonial, forwardRef }) => (
  <div ref={forwardRef} className="group relative h-full">
    <div className="relative h-full p-6 md:p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100">
      {/* Quote Icon */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <Quote className="w-10 h-10 md:w-16 md:h-16 text-black" fill="currentColor" />
      </div>

      {/* Stars */}
      <div className="flex gap-1 mb-3 md:mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star
            key={i}
            className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-500 fill-yellow-500"
          />
        ))}
      </div>

      {/* Content */}
      <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4 md:mb-6 relative z-10">
        "{testimonial.content}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-100">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm md:text-base">
            {testimonial.name}
          </div>
          <div className="text-xs md:text-sm text-gray-600">
            {testimonial.role}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const Testimonials = () => {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            { x: index % 2 === 0 ? -60 : 60, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 1,
              delay: index * 0.2,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 80%',
              },
            }
          )
        }
      })
    }
  }, [isMobile])

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-16 md:py-24 lg:py-32 px-4 md:px-8 lg:px-16 xl:px-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16 lg:mb-20">
          <span className="text-xs md:text-sm font-semibold tracking-[0.2em] md:tracking-[0.3em] uppercase text-gray-500 mb-3 md:mb-4 block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 md:mb-6">
            Trusted by Players
            <br />
            <span className="italic font-light text-gray-600">Around the World</span>
          </h2>
          <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Join thousands of golfers who have elevated their game with Astari equipment
          </p>
        </div>

        {/* Mobile: Swiper Carousel */}
        <div className="md:hidden mb-8">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-gray-300 !w-2 !h-2',
              bulletActiveClass: '!bg-emerald-500 !w-6',
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            slidesPerView={1.15}
            spaceBetween={16}
            centeredSlides
            loop
            className="!pb-10"
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <TestimonialCard testimonial={testimonial} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial}
              forwardRef={(el) => (cardsRef.current[index] = el)}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-12 pt-8 md:pt-12 border-t border-gray-200">
          <div className="text-center min-w-[80px]">
            <div className="text-2xl md:text-3xl font-bold mb-1">4.9/5</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase tracking-wider">Average Rating</div>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="text-2xl md:text-3xl font-bold mb-1">2,500+</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase tracking-wider">Reviews</div>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="text-2xl md:text-3xl font-bold mb-1">100%</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase tracking-wider">Authentic</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
