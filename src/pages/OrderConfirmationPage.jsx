import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { CheckCircle2, Package, Mail, MapPin, Calendar, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const OrderConfirmationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { order, customerData } = location.state || {}

  const headerRef = useRef(null)
  const contentRef = useRef(null)
  const checkmarkRef = useRef(null)

  useEffect(() => {
    // Redirect if no order data
    if (!order) {
      navigate('/')
      return
    }

    // GSAP entrance animations
    const ctx = gsap.context(() => {
      // Checkmark animation
      gsap.fromTo(
        checkmarkRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
          delay: 0.2
        }
      )

      // Header fade in
      gsap.from(headerRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.5
      })

      // Content fade in
      gsap.from(contentRef.current.children, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.8
      })

      // Confetti-like animation (subtle)
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div')
        particle.className = 'confetti-particle'
        particle.style.cssText = `
          position: fixed;
          width: ${Math.random() * 8 + 4}px;
          height: ${Math.random() * 8 + 4}px;
          background: ${['#10b981', '#14b8a6', '#D4AF37'][Math.floor(Math.random() * 3)]};
          border-radius: 50%;
          top: 20%;
          left: ${Math.random() * 100}%;
          pointer-events: none;
          z-index: 9999;
        `
        document.body.appendChild(particle)

        gsap.to(particle, {
          y: window.innerHeight,
          x: `+=${Math.random() * 200 - 100}`,
          rotation: Math.random() * 720,
          opacity: 0,
          duration: Math.random() * 2 + 2,
          ease: 'power2.in',
          onComplete: () => particle.remove()
        })
      }
    })

    return () => ctx.revert()
  }, [order, navigate])

  if (!order) {
    return null
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const estimatedDeliveryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 5) // 5 business days
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f26] to-[#252a32]">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="success-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="2" fill="currentColor" className="text-emerald-400" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#success-pattern)" />
        </svg>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              ref={checkmarkRef}
              className="relative"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              {/* Pulse Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-emerald-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Header */}
          <div ref={headerRef} className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
              Order Confirmed!
            </h1>
            <p className="text-xl text-gray-400 mb-2">
              Thank you for your purchase
            </p>
            <p className="text-lg text-emerald-400 font-semibold">
              Order #{order.order_number}
            </p>
          </div>

          {/* Content Cards */}
          <div ref={contentRef} className="space-y-6">
            {/* Confirmation Email Notice */}
            <motion.div
              className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Confirmation Email Sent
                  </h3>
                  <p className="text-sm text-gray-300">
                    We've sent a confirmation email to <span className="font-semibold text-emerald-300">{customerData.email}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Order Details Card */}
            <motion.div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-600/20 border-b border-emerald-500/30 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-400" />
                  Order Details
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Items Ordered
                  </h3>
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.product_id} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-white">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Shipping</span>
                    <span className="text-white">{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>VAT (20%)</span>
                    <span className="text-white">{formatPrice(order.tax)}</span>
                  </div>
                  <Separator className="my-3 bg-white/10" />
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Total Paid</span>
                    <span className="text-emerald-400">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Delivery Information */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Delivery Address
                      </h3>
                      <p className="text-white">{customerData.name}</p>
                      <p className="text-sm text-gray-400">
                        {customerData.address.line1}
                        {customerData.address.line2 && <>, {customerData.address.line2}</>}
                      </p>
                      <p className="text-sm text-gray-400">
                        {customerData.address.city}, {customerData.address.postcode}
                      </p>
                      <p className="text-sm text-gray-400">
                        {customerData.address.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Estimated Delivery
                      </h3>
                      <p className="text-white font-semibold">
                        {estimatedDeliveryDate()}
                      </p>
                      <p className="text-sm text-gray-400">
                        5-7 business days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* What's Next Card */}
            <motion.div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">
                What happens next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    1
                  </div>
                  <p className="text-gray-300">
                    We'll send you an email confirmation with your order details
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    2
                  </div>
                  <p className="text-gray-300">
                    Your items will be carefully packaged and dispatched within 24 hours
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    3
                  </div>
                  <p className="text-gray-300">
                    You'll receive tracking information once your order ships
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate('/')}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40"
              >
                <Home className="mr-2 w-5 h-5" />
                Back to Home
              </Button>

              <Button
                onClick={() => navigate('/products')}
                variant="outline"
                className="flex-1 h-12 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all duration-300"
              >
                Continue Shopping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Support Notice */}
            <p className="text-center text-sm text-gray-500 pt-4">
              Need help? Contact us at{' '}
              <a href="mailto:support@astari.golf" className="text-emerald-400 hover:underline">
                support@astari.golf
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderConfirmationPage
