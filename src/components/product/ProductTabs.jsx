import { useState } from 'react'
import { Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'description', label: 'Description' },
  { id: 'details', label: 'Details' },
  { id: 'reviews', label: 'Reviews' },
]

// Mock reviews - replace with real data later
const mockReviews = [
  {
    id: 1,
    author: 'John D.',
    rating: 5,
    date: '2024-01-15',
    title: 'Excellent quality grip',
    content: 'Best grip I have ever used. The feel is amazing and it really helped improve my game. Highly recommend!',
    verified: true,
  },
  {
    id: 2,
    author: 'Sarah M.',
    rating: 4,
    date: '2024-01-10',
    title: 'Great product, fast shipping',
    content: 'Very happy with this purchase. The grip feels premium and looks great on my clubs. Only minor issue was the sizing chart was a bit confusing.',
    verified: true,
  },
  {
    id: 3,
    author: 'Mike R.',
    rating: 5,
    date: '2024-01-05',
    title: 'Perfect for all weather',
    content: 'I play in all conditions and this grip performs brilliantly in both wet and dry weather. Worth every penny.',
    verified: false,
  },
]

const ProductTabs = ({ product }) => {
  const [activeTab, setActiveTab] = useState('description')

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-white/20 text-white/20'
          )}
        />
      ))}
    </div>
  )

  return (
    <div className="border-t border-white/10">
      {/* Tab Headers */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-6 py-4 text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-white'
                : 'text-white/50 hover:text-white/70'
            )}
          >
            {tab.label}
            {tab.id === 'reviews' && (
              <span className="ml-2 text-xs text-white/40">({mockReviews.length})</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="prose prose-invert max-w-none">
            <p className="text-white/70 leading-relaxed">
              {product?.description || 'No description available.'}
            </p>

            {/* Features List */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                Key Features
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Premium materials ensure long-lasting durability
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Engineered for optimal performance in all conditions
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Designed with input from professional golfers
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Suitable for all skill levels
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <table className="w-full">
              <tbody className="divide-y divide-white/10">
                {product?.brand_name && (
                  <tr>
                    <td className="py-3 text-sm text-white/50 w-1/3">Brand</td>
                    <td className="py-3 text-sm font-medium text-white">{product.brand_name}</td>
                  </tr>
                )}
                {product?.category_name && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">Category</td>
                    <td className="py-3 text-sm font-medium text-white">{product.category_name}</td>
                  </tr>
                )}
                {product?.sku && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">SKU</td>
                    <td className="py-3 text-sm font-medium text-white font-mono">{product.sku}</td>
                  </tr>
                )}
                {product?.style_no && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">Style Number</td>
                    <td className="py-3 text-sm font-medium text-white font-mono">{product.style_no}</td>
                  </tr>
                )}
                {product?.material && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">Material</td>
                    <td className="py-3 text-sm font-medium text-white">{product.material}</td>
                  </tr>
                )}
                {product?.weight && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">Weight</td>
                    <td className="py-3 text-sm font-medium text-white">{product.weight}g</td>
                  </tr>
                )}
                {product?.core_size && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">Core Size</td>
                    <td className="py-3 text-sm font-medium text-white">{product.core_size}"</td>
                  </tr>
                )}
                {product?.colour_name && (
                  <tr>
                    <td className="py-3 text-sm text-white/50">Colour</td>
                    <td className="py-3 text-sm font-medium text-white flex items-center gap-2">
                      {product.colour_hex && (
                        <span
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: product.colour_hex }}
                        />
                      )}
                      {product.colour_name}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Reviews Summary */}
            <div className="flex items-center gap-6 pb-6 border-b border-white/10">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">4.7</div>
                <div className="mt-1">{renderStars(5)}</div>
                <div className="text-sm text-white/50 mt-1">{mockReviews.length} reviews</div>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = mockReviews.filter(r => r.rating === rating).length
                  const percentage = (count / mockReviews.length) * 100
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-white/60">{rating}</span>
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-white/50">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {mockReviews.map((review) => (
                <div key={review.id} className="pb-6 border-b border-white/10 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{review.author}</span>
                          {review.verified && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {renderStars(review.rating)}
                          <span className="text-xs text-white/40">
                            {new Date(review.date).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-medium text-white mt-3">{review.title}</h4>
                  <p className="text-white/60 mt-1">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductTabs
