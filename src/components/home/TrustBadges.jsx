import { Truck, Shield, RotateCcw, Award } from 'lucide-react'

const badges = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over £50',
  },
  {
    icon: Shield,
    title: 'Secure Checkout',
    description: '256-bit SSL encryption',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: Award,
    title: 'Quality Guarantee',
    description: 'Authentic products only',
  },
]

const TrustBadges = () => {
  return (
    <section className="py-12 md:py-16 px-4 md:px-8 lg:px-16 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.title}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4 group-hover:border-emerald-300 group-hover:shadow-md transition-all duration-300">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-emerald-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-gray-900 font-semibold text-sm md:text-base">
                  {badge.title}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm mt-1">
                  {badge.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TrustBadges
