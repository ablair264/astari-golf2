import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Star, Quote } from 'lucide-react'

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

const Testimonials = () => {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
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
    })
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 px-4 md:px-8 lg:px-16 xl:px-24 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="text-sm font-semibold tracking-[0.3em] uppercase text-gray-500 mb-4 block">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Trusted by Players
            <br />
            <span className="italic font-light text-gray-600">Around the World</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of golfers who have elevated their game with Astari equipment
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  <Quote className="w-16 h-16 text-black" fill="currentColor" />
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-12 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">4.9/5</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">2,500+</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">100%</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider">Authentic</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
