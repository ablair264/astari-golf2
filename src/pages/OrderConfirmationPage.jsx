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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="success-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="2" fill="currentColor" className="text-emerald-600" />
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
            <h1 className="font-['Playfair_Display'] text-5xl md:text-6xl font-bold text-stone-900 tracking-tight mb-4">
              Order Confirmed!
            </h1>
            <p className="font-['DM_Sans'] text-xl text-stone-600 mb-2">
              Thank you for your purchase
            </p>
            <p className="font-['DM_Sans'] text-lg text-emerald-600 font-semibold">
              Order #{order.order_number}
            </p>
          </div>

          {/* Content Cards */}
          <div ref={contentRef} className="space-y-6">
            {/* Confirmation Email Notice */}
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold mb-1">
                    Confirmation Email Sent
                  </h3>
                  <p className="font-['DM_Sans'] text-sm text-white/90">
                    We've sent a confirmation email to <span className="font-semibold">{customerData.email}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Order Details Card */}
            <motion.div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-6">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Order Details
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="font-['DM_Sans'] text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">
                    Items Ordered
                  </h3>
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.product_id} className="flex justify-between items-center py-3 border-b border-stone-200 last:border-0">
                        <div>
                          <p className="font-['DM_Sans'] font-medium text-stone-900">{item.name}</p>
                          <p className="font-['DM_Sans'] text-sm text-stone-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-['DM_Sans'] font-semibold text-stone-900">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2 font-['DM_Sans']">
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>VAT (20%)</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-xl font-bold">
                    <span className="font-['Playfair_Display']">Total Paid</span>
                    <span className="text-emerald-600">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                <Separator />

                {/* Delivery Information */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-['DM_Sans'] text-sm font-semibold text-stone-700 uppercase tracking-wider mb-1">
                        Delivery Address
                      </h3>
                      <p className="font-['DM_Sans'] text-stone-900">{customerData.name}</p>
                      <p className="font-['DM_Sans'] text-sm text-stone-600">
                        {customerData.address.line1}
                        {customerData.address.line2 && <>, {customerData.address.line2}</>}
                      </p>
                      <p className="font-['DM_Sans'] text-sm text-stone-600">
                        {customerData.address.city}, {customerData.address.postcode}
                      </p>
                      <p className="font-['DM_Sans'] text-sm text-stone-600">
                        {customerData.address.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-['DM_Sans'] text-sm font-semibold text-stone-700 uppercase tracking-wider mb-1">
                        Estimated Delivery
                      </h3>
                      <p className="font-['DM_Sans'] text-stone-900 font-semibold">
                        {estimatedDeliveryDate()}
                      </p>
                      <p className="font-['DM_Sans'] text-sm text-stone-600">
                        5-7 business days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* What's Next Card */}
            <motion.div className="bg-stone-100 rounded-2xl p-6 border border-stone-200">
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900 mb-4">
                What happens next?
              </h3>
              <div className="space-y-3 font-['DM_Sans']">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    1
                  </div>
                  <p className="text-stone-700">
                    We'll send you an email confirmation with your order details
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    2
                  </div>
                  <p className="text-stone-700">
                    Your items will be carefully packaged and dispatched within 24 hours
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    3
                  </div>
                  <p className="text-stone-700">
                    You'll receive tracking information once your order ships
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate('/')}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-['DM_Sans'] font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40"
              >
                <Home className="mr-2 w-5 h-5" />
                Back to Home
              </Button>

              <Button
                onClick={() => navigate('/products')}
                variant="outline"
                className="flex-1 h-12 border-2 border-stone-300 hover:border-emerald-600 hover:bg-emerald-50 font-['DM_Sans'] font-semibold transition-all duration-300"
              >
                Continue Shopping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Support Notice */}
            <p className="text-center text-sm text-stone-500 font-['DM_Sans'] pt-4">
              Need help? Contact us at{' '}
              <a href="mailto:support@astari.golf" className="text-emerald-600 hover:underline">
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
