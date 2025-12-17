import { Minus, Plus, X, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart, cartUtils } from '@/contexts/CartContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    cart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    subtotal,
    tax,
    shipping,
    total
  } = useCart()

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  const handleViewCart = () => {
    onClose()
    navigate('/cart')
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-gradient-to-br from-[#2a3138] to-[#303843] border-gray-700/50 p-0 flex flex-col"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        {/* Header */}
        <SheetHeader className="border-b border-gray-700/50 p-6">
          <SheetTitle
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            <ShoppingBag className="w-6 h-6" />
            Shopping Cart
            {cart.length > 0 && (
              <span className="text-sm font-normal text-gray-400">
                ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-300 mb-2">
                Your cart is empty
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Add some products to get started
              </p>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onRemove={() => removeFromCart(item.id)}
                onIncrement={() => incrementQuantity(item.id)}
                onDecrement={() => decrementQuantity(item.id)}
              />
            ))
          )}
        </div>

        {/* Footer with totals and CTAs */}
        {cart.length > 0 && (
          <div className="border-t border-gray-700/50 p-6 space-y-4 bg-[#252a32]">
            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>{cartUtils.formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax (20%)</span>
                <span>{cartUtils.formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : cartUtils.formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && subtotal < 50 && (
                <p className="text-xs text-emerald-400">
                  Add {cartUtils.formatPrice(50 - subtotal)} more for free shipping!
                </p>
              )}
              <Separator className="bg-gray-700/50" />
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>{cartUtils.formatPrice(total)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 font-semibold shadow-lg hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/25"
              >
                Proceed to Checkout
              </Button>
              <Button
                onClick={handleViewCart}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-700"
              >
                View Full Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const CartItemCard = ({ item, onRemove, onIncrement, onDecrement }) => {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-[#1e2329] border border-gray-700/50 transition-all hover:border-gray-600">
      {/* Product Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/5">
        {item.media ? (
          <img
            src={item.media}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-sm truncate">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {item.brand_logo && (
                <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/80">
                  <img
                    src={item.brand_logo}
                    alt={item.brand}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </span>
              )}
              <span className="truncate">{item.brand || 'Astari'}</span>
              {item.category && <span>• {item.category}</span>}
              {item.style_no && <span>• Style {item.style_no}</span>}
            </div>
            {item.colour_hex && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                <span
                  className="inline-flex h-3.5 w-3.5 rounded-full border border-black/20"
                  style={{ backgroundColor: item.colour_hex }}
                />
                <span className="capitalize">{item.colour_name || 'Colour'}</span>
                {item.sku && <span className="text-gray-500">SKU {item.sku}</span>}
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-900/20 rounded transition-colors group flex-shrink-0"
            aria-label="Remove item"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-white">
            {cartUtils.formatPrice(item.final_price ?? item.calculated_price ?? item.price)}
          </span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-[#252a32] rounded-lg p-1">
            <button
              onClick={onDecrement}
              className="p-1 hover:bg-emerald-600/20 rounded transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3 text-gray-300" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-white">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="p-1 hover:bg-emerald-600/20 rounded transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer
