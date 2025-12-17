import { Instagram, Heart, MessageCircle } from 'lucide-react'

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

const InstagramFeed = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 text-gray-600 mb-3">
            <Instagram className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wider uppercase">
              @astarigolf
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Follow Our Journey
          </h2>
          <p className="text-gray-600 mt-3 max-w-lg mx-auto">
            Join our community for the latest product drops, golf tips, and behind-the-scenes content
          </p>
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {mockPosts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/astarigolf"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
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
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-current" />
                    <span className="text-sm font-medium">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Follow CTA */}
        <div className="text-center mt-10">
          <a
            href="https://instagram.com/astarigolf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300"
          >
            <Instagram className="w-5 h-5" />
            Follow Us on Instagram
          </a>
        </div>
      </div>
    </section>
  )
}

export default InstagramFeed
