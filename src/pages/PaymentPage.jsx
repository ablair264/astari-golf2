import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useCart } from '@/contexts/CartContext'
import {
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { placeOrder } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  })
  const [errors, setErrors] = useState({})

  const headerRef = useRef(null)
  const formRef = useRef(null)
  const lockIconRef = useRef(null)

  // Get data passed from checkout
  const { formData, cart, subtotal, tax, shipping, total } = location.state || {}

  useEffect(() => {
    // Redirect if no checkout data
    if (!formData || !cart) {
      navigate('/checkout')
      return
    }

    // GSAP entrance animation
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      })

      gsap.from(formRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2
      })

      // Lock icon pulse animation
      gsap.to(lockIconRef.current, {
        scale: 1.1,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    })

    return () => ctx.revert()
  }, [formData, cart, navigate])

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ').substr(0, 19) // Max 16 digits + 3 spaces
  }

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2)
    }
    return cleaned
  }

  const handleInputChange = (field, value) => {
    let formattedValue = value

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value)
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substr(0, 3)
    }

    setPaymentData(prev => ({
      ...prev,
      [field]: formattedValue
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validatePayment = () => {
    const newErrors = {}

    if (!paymentData.cardName.trim()) newErrors.cardName = 'Cardholder name is required'

    const cardNumberDigits = paymentData.cardNumber.replace(/\s/g, '')
    if (!cardNumberDigits) {
      newErrors.cardNumber = 'Card number is required'
    } else if (cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Invalid card number'
    }

    if (!paymentData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required'
    } else {
      const [month, year] = paymentData.expiryDate.split('/')
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear() % 100
      const currentMonth = currentDate.getMonth() + 1

      if (
        !month ||
        !year ||
        parseInt(month) < 1 ||
        parseInt(month) > 12 ||
        (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth))
      ) {
        newErrors.expiryDate = 'Invalid or expired date'
      }
    }

    if (!paymentData.cvv) {
      newErrors.cvv = 'CVV is required'
    } else if (paymentData.cvv.length !== 3) {
      newErrors.cvv = 'Invalid CVV'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!validatePayment()) {
      return
    }

    setIsProcessing(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const order = await placeOrder(formData)

      // Navigate to confirmation with order data
      navigate('/order-confirmation', {
        state: {
          order,
          customerData: formData
        }
      })
    } catch (error) {
      console.error('Error placing order:', error)
      setErrors({ general: 'Failed to place order. Please try again.' })
      setIsProcessing(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f26] to-[#252a32]">
      {/* Header */}
      <header ref={headerRef} className="relative z-10 py-8 px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="max-w-[1400px] mx-auto">
          <button
            onClick={() => navigate('/checkout')}
            className="group flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors duration-300 mb-8"
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="font-medium">Back to Details</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold tracking-[0.3em] uppercase text-emerald-400 mb-4 block">
                Secure Payment
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                Payment
              </h1>
              <p className="text-gray-400 mt-4">
                Your payment information is encrypted and secure
              </p>
            </div>

            {/* Security Badge */}
            <div ref={lockIconRef} className="hidden md:flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">
                256-bit Encrypted
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 md:px-8 lg:px-16 xl:px-24 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            ref={formRef}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Payment Method Header */}
            <div className="bg-emerald-600/20 border-b border-emerald-500/30 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-emerald-500/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Card Payment
                  </h2>
                  <p className="text-sm text-emerald-200 mt-0.5">
                    We accept Visa, Mastercard, and Amex
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="p-8 md:p-10">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="space-y-6">
                {/* Card Number */}
                <div>
                  <Label htmlFor="cardNumber" className="text-gray-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    className={`mt-1.5 text-lg tracking-wider bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.cardNumber ? 'border-red-500' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                  {errors.cardNumber && <p className="text-xs text-red-400 mt-1">{errors.cardNumber}</p>}
                </div>

                {/* Cardholder Name */}
                <div>
                  <Label htmlFor="cardName" className="text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cardholder Name
                  </Label>
                  <Input
                    id="cardName"
                    value={paymentData.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value.toUpperCase())}
                    className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.cardName ? 'border-red-500' : ''}`}
                    placeholder="JOHN SMITH"
                  />
                  {errors.cardName && <p className="text-xs text-red-400 mt-1">{errors.cardName}</p>}
                </div>

                {/* Expiry & CVV */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate" className="text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.expiryDate ? 'border-red-500' : ''}`}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.expiryDate && <p className="text-xs text-red-400 mt-1">{errors.expiryDate}</p>}
                  </div>

                  <div>
                    <Label htmlFor="cvv" className="text-gray-300 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      type="password"
                      value={paymentData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.cvv ? 'border-red-500' : ''}`}
                      placeholder="123"
                      maxLength={3}
                    />
                    {errors.cvv && <p className="text-xs text-red-400 mt-1">{errors.cvv}</p>}
                  </div>
                </div>

                <Separator className="my-8 bg-white/10" />

                {/* Order Summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Shipping</span>
                    <span className="text-white">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>VAT (20%)</span>
                    <span className="text-white">{formatPrice(tax)}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-emerald-400">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    <>
                      <Lock className="mr-2 w-5 h-5" />
                      Place Order - {formatPrice(total)}
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <p className="text-xs text-center text-gray-500 mt-4">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default PaymentPage
