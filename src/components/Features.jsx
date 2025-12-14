import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Droplets, Shield, Sparkles, Trophy } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: Droplets,
    title: 'All-Weather Performance',
    description: 'Advanced moisture-wicking technology ensures optimal grip in any condition, rain or shine.',
  },
  {
    icon: Shield,
    title: 'Tournament Tested',
    description: 'Trusted by professionals worldwide in the most demanding competitive environments.',
  },
  {
    icon: Sparkles,
    title: 'Premium Materials',
    description: 'Only the finest compounds and textiles, engineered for durability and feel.',
  },
  {
    icon: Trophy,
    title: 'Champion Approved',
    description: 'Designed with input from tour players who demand perfection in every detail.',
  },
]

const Features = () => {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      gsap.fromTo(
        card,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        }
      )
    })
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 px-4 md:px-8 lg:px-16 xl:px-24 bg-[#303843] overflow-hidden"
    >
      {/* Pattern Background Overlay */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'url(/pattern.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }}
      />

      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="text-sm font-semibold tracking-[0.3em] uppercase text-gray-400 mb-4 block">
            Why Choose Astari
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Uncompromising Quality,
            <br />
            <span className="italic font-light text-gray-300">Unmatched Performance</span>
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                ref={(el) => (cardsRef.current[index] = el)}
                className="group relative"
              >
                {/* Card */}
                <div className="relative h-full p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500">
                  {/* Icon */}
                  <div className="mb-6 inline-flex">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                      <div className="relative w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-500">
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>

                  {/* Decorative line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 text-lg mb-6">
            Experience the difference that true craftsmanship makes
          </p>
          <button className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Explore Our Technology
          </button>
        </div>
      </div>
    </section>
  )
}

export default Features
