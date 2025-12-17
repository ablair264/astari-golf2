import { useState, useEffect } from 'react'
import { Instagram, Heart, MessageCircle } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/free-mode'

// Mock Instagram posts - replace with real API data later
const mockPosts = [
  {
    id: 1,
    image: '/images/instagram/1.jpg',
    likes: 234,
    comments: 12,
  },
  {
    id: 2,
    image: '/images/instagram/2.jpg',
    likes: 189,
    comments: 8,
  },
  {
    id: 3,
    image: '/images/instagram/3.jpg',
    likes: 342,
    comments: 24,
  },
  {
    id: 4,
    image: '/images/instagram/4.jpg',
    likes: 156,
    comments: 6,
  },
  {
    id: 5,
    image: '/images/instagram/5.jpg',
    likes: 278,
    comments: 15,
  },
  {
    id: 6,
    image: '/images/instagram/6.jpg',
    likes: 198,
    comments: 11,
  },
]

const InstagramPost = ({ post }) => (
  <a
    href="https://instagram.com/astarigolf"
    target="_blank"
    rel="noopener noreferrer"
    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 block"
  >
    {/* Image */}
    <img
      src={post.image}
      alt={`Instagram post ${post.id}`}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={(e) => {
        // Fallback placeholder
        e.target.src = `https://placehold.co/400x400/1a1f27/10b981?text=ASTARI`
      }}
    />

    {/* Hover Overlay */}
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
      <div className="flex items-center gap-3 md:gap-4 text-white">
        <div className="flex items-center gap-1 md:gap-1.5">
          <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          <span className="text-xs md:text-sm font-medium">{post.likes}</span>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-xs md:text-sm font-medium">{post.comments}</span>
        </div>
      </div>
    </div>
  </a>
)

const InstagramFeed = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="py-12 md:py-16 lg:py-24 px-4 md:px-8 lg:px-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 text-gray-600 mb-2 md:mb-3">
            <Instagram className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm font-medium tracking-wider uppercase">
              @astarigolf
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Follow Our Journey
          </h2>
          <p className="text-gray-600 text-sm md:text-base mt-2 md:mt-3 max-w-lg mx-auto px-4">
            Join our community for the latest product drops, golf tips, and behind-the-scenes content
          </p>
        </div>

        {/* Mobile: Horizontal Swiper */}
        {isMobile && (
          <div className="md:hidden -mx-4">
            <Swiper
              modules={[FreeMode]}
              freeMode={{
                enabled: true,
                momentum: true,
              }}
              slidesPerView={2.3}
              spaceBetween={12}
              className="!px-4"
            >
              {mockPosts.map((post) => (
                <SwiperSlide key={post.id}>
                  <InstagramPost post={post} />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="text-center mt-3 text-xs text-gray-400">
              Swipe to see more
            </div>
          </div>
        )}

        {/* Desktop: Grid Layout */}
        {!isMobile && (
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {mockPosts.map((post) => (
              <InstagramPost key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Follow CTA */}
        <div className="text-center mt-8 md:mt-10">
          <a
            href="https://instagram.com/astarigolf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-sm md:text-base font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300"
          >
            <Instagram className="w-4 h-4 md:w-5 md:h-5" />
            Follow Us on Instagram
          </a>
        </div>
      </div>
    </section>
  )
}

export default InstagramFeed
