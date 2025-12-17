import { Heart, ShoppingBag, X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { getProductsByCategory } from '@/services/products'

const WishlistDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [similarProducts, setSimilarProducts] = useState([])

  // Load similar products when wishlist changes
  useEffect(() => {
    const loadSimilarProducts = async () => {
      if (wishlist.length === 0) {
        setSimilarProducts([])
        return
      }

      // Get categories from wishlist items
      const categories = [...new Set(wishlist.map(item => item.category))]

      // Fetch products from these categories
      const productsPromises = categories.map(category => getProductsByCategory(category))
      const productsArrays = await Promise.all(productsPromises)
      const allProducts = productsArrays.flat()

      // Filter out products already in wishlist and limit to 4
      const wishlistIds = wishlist.map(item => item.id)
      const filtered = allProducts
        .filter(product => !wishlistIds.includes(product.id))
        .slice(0, 4)

      setSimilarProducts(filtered)
    }

    if (isOpen) {
      loadSimilarProducts()
    }
  }, [wishlist, isOpen])

  const handleAddToCart = (product) => {
    addToCart(product, 1)
  }

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-gradient-to-br from-[#2a3138] to-[#303843] border-l border-gray-700/50 overflow-y-auto"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <SheetHeader className="mb-6">
          <SheetTitle
            className="text-2xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            <Heart className="w-6 h-6 text-emerald-500" />
            My Wishlist ({wishlist.length})
          </SheetTitle>
        </SheetHeader>

        {wishlist.length === 0 ? (
          /* Empty Wishlist State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h3>
            <p className="text-gray-400 mb-6 max-w-sm">
              Save items you love to your wishlist and easily find them later!
            </p>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
            >
              Start Browsing
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Wishlist Items */}
            <div className="space-y-4">
              {wishlist.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeFromWishlist(item.id)}
                  onAddToCart={() => handleAddToCart(item)}
                  onView={() => handleViewProduct(item.id)}
                />
              ))}
            </div>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
              <>
                <Separator className="bg-gray-700/50" />

                <div>
                  <h3
                    className="text-lg font-bold text-white mb-4"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    You Might Also Like
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {similarProducts.map((product) => (
                      <SimilarProductCard
                        key={product.id}
                        product={product}
                        onView={() => handleViewProduct(product.id)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const WishlistItemCard = ({ item, onRemove, onAddToCart, onView }) => {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-[#1e2329] to-[#252a32] border border-gray-700/50 transition-all hover:border-gray-600">
      {/* Product Image */}
      <button
        onClick={onView}
        className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        {item.media ? (
          <img
            src={item.media}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ShoppingBag className="w-10 h-10" />
          </div>
        )}
      </button>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <button
            onClick={onView}
            className="text-left hover:text-emerald-400 transition-colors"
          >
            <h4 className="text-base font-semibold text-white mb-1 truncate">
              {item.name}
            </h4>
          </button>
          <p className="text-xs text-gray-400 mb-2">
            {item.brand} • {item.category}
          </p>
          <p className="text-lg font-bold text-white">
            £{item.final_price ?? item.calculated_price ?? item.price}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={onAddToCart}
            size="sm"
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-8 text-xs"
          >
            <ShoppingBag className="w-3 h-3 mr-1" />
            Add to Cart
          </Button>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors group"
            aria-label="Remove from wishlist"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}

const SimilarProductCard = ({ product, onView }) => {
  return (
    <button
      onClick={onView}
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-800">
        {product.media ? (
          <img
            src={product.media}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Product Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-xs text-gray-200 mb-1 truncate">{product.brand}</p>
        <p className="text-sm font-semibold text-white truncate mb-1">{product.name}</p>
        <p className="text-base font-bold text-white">£{product.final_price ?? product.calculated_price ?? product.price}</p>
      </div>

      {/* Plus icon overlay on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <Plus className="w-6 h-6 text-black" />
        </div>
      </div>
    </button>
  )
}

export default WishlistDrawer
