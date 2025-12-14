import { Minus, Plus, X, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart, cartUtils } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const CartPage = () => {
  const navigate = useNavigate()
  const {
    cart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    subtotal,
    tax,
    shipping,
    total
  } = useCart()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f26] to-[#252a32]">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </button>
            <h1
              className="text-4xl font-bold text-white"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Shopping Cart
            </h1>
            <p className="text-gray-400 mt-2">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {cart.length > 0 && (
            <Button
              onClick={clearCart}
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-900/20"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 flex items-center justify-center mb-6">
              <ShoppingBag className="w-16 h-16 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Looks like you haven't added any items to your cart yet. Browse our collection and find something you love!
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items - Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeFromCart(item.id)}
                  onIncrement={() => incrementQuantity(item.id)}
                  onDecrement={() => decrementQuantity(item.id)}
                />
              ))}
            </div>

            {/* Order Summary - Right Column (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl bg-gradient-to-br from-[#2a3138] to-[#303843] border border-gray-700/50 p-6 space-y-6">
                <h2
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Order Summary
                </h2>

                <Separator className="bg-gray-700/50" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({cart.length} items)</span>
                    <span className="font-semibold">{cartUtils.formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Tax (20% VAT)</span>
                    <span className="font-semibold">{cartUtils.formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-emerald-400">FREE</span>
                      ) : (
                        cartUtils.formatPrice(shipping)
                      )}
                    </span>
                  </div>

                  {/* Free Shipping Progress */}
                  {shipping > 0 && subtotal < 50 && (
                    <div className="rounded-lg bg-emerald-900/20 border border-emerald-500/30 p-3">
                      <p className="text-xs text-emerald-400 mb-2">
                        Add {cartUtils.formatPrice(50 - subtotal)} more for FREE shipping!
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(subtotal / 50) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Separator className="bg-gray-700/50" />

                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span>{cartUtils.formatPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 font-semibold text-lg py-6 shadow-lg hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/25"
                >
                  Proceed to Checkout
                </Button>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Secure Checkout
                  </div>
                  <span>•</span>
                  <div>SSL Encrypted</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

const CartItemRow = ({ item, onRemove, onIncrement, onDecrement }) => {
  return (
    <div className="flex gap-6 p-6 rounded-2xl bg-gradient-to-br from-[#2a3138] to-[#303843] border border-gray-700/50 transition-all hover:border-gray-600">
      {/* Product Image */}
      <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
        {item.media ? (
          <img
            src={item.media}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-gray-400">
                {item.brand} • {item.category}
              </p>
            </div>
            <button
              onClick={onRemove}
              className="p-2 hover:bg-red-900/20 rounded-lg transition-colors group"
              aria-label="Remove item"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-[#1e2329] rounded-lg p-2">
            <button
              onClick={onDecrement}
              className="p-2 hover:bg-emerald-600/20 rounded-lg transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 text-gray-300" />
            </button>
            <span className="w-12 text-center text-lg font-semibold text-white">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="p-2 hover:bg-emerald-600/20 rounded-lg transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {cartUtils.formatPrice(item.price * item.quantity)}
            </div>
            {item.quantity > 1 && (
              <div className="text-sm text-gray-400">
                {cartUtils.formatPrice(item.price)} each
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
