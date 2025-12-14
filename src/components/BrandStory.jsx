import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const BrandStory = () => {
  const sectionRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const text = textRef.current
    const image = imageRef.current

    // Parallax effect for text
    gsap.fromTo(
      text,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1,
        },
      }
    )

    // Parallax effect for image
    gsap.fromTo(
      image,
      { y: 150, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1,
        },
      }
    )
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 px-4 md:px-8 lg:px-16 xl:px-24 bg-white overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Bold Statement */}
          <div ref={textRef} className="space-y-8">
            <div className="space-y-4">
              <span className="text-sm font-semibold tracking-[0.3em] uppercase text-gray-500">
                Our Story
              </span>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                Engineered for
                <br />
                <span className="italic font-light">Champions</span>
              </h2>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p className="text-lg md:text-xl">
                At Astari, we believe that greatness begins with grip. Every
                product we craft is a testament to precision engineering and
                unwavering dedication to the game.
              </p>
              <p className="text-base md:text-lg">
                From the first touch to the final swing, our equipment becomes
                an extension of your skill. We don't just make golf equipment—we
                forge the tools that define champions.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">15+</div>
                <div className="text-sm text-gray-600 uppercase tracking-wider">
                  Years Crafting
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">50K+</div>
                <div className="text-sm text-gray-600 uppercase tracking-wider">
                  Golfers Trust Us
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">98%</div>
                <div className="text-sm text-gray-600 uppercase tracking-wider">
                  Satisfaction Rate
                </div>
              </div>
            </div>
          </div>

          {/* Right: Image with Overlay */}
          <div ref={imageRef} className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 relative">
              <img
                src="/1.jpg"
                alt="Astari Golf Equipment"
                className="w-full h-full object-cover"
              />
              {/* Decorative Element */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Quote Overlay */}
              <div className="absolute bottom-8 left-8 right-8">
                <blockquote className="text-white">
                  <p className="text-xl md:text-2xl font-light italic leading-tight mb-3">
                    "Every grip tells a story of dedication and precision."
                  </p>
                  <footer className="text-sm uppercase tracking-wider font-semibold">
                    — Astari Philosophy
                  </footer>
                </blockquote>
              </div>
            </div>

            {/* Decorative corner accent */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-4 border-black rounded-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default BrandStory
