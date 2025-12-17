import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useCart } from '@/contexts/CartContext'
import { ChevronRight, ShoppingBag, CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const STEPS = [
  { id: 1, name: 'Details', icon: ShoppingBag },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'Confirm', icon: CheckCircle2 }
]

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, subtotal, tax, shipping, total, itemCount } = useCart()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      postcode: '',
      country: 'United Kingdom'
    }
  })
  const [errors, setErrors] = useState({})

  const headerRef = useRef(null)
  const formRef = useRef(null)
  const summaryRef = useRef(null)

  useEffect(() => {
    // Redirect if cart is empty
    if (itemCount === 0) {
      navigate('/')
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

      gsap.from([formRef.current, summaryRef.current], {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2
      })
    })

    return () => ctx.revert()
  }, [itemCount, navigate])

  const validateStep1 = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.address.line1.trim()) newErrors.addressLine1 = 'Address is required'
    if (!formData.address.city.trim()) newErrors.city = 'City is required'
    if (!formData.address.postcode.trim()) newErrors.postcode = 'Postcode is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinueToPayment = () => {
    if (validateStep1()) {
      setCurrentStep(2)
      navigate('/payment', { state: { formData, cart, subtotal, tax, shipping, total } })
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price)
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f26] to-[#252a32]">

      {/* Header */}
      <header ref={headerRef} className="relative z-10 py-6 md:py-8 px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="max-w-[1400px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors duration-300 mb-4 md:mb-8"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="font-medium text-sm md:text-base">Back to Cart</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
            <div>
              <span className="text-xs md:text-sm font-semibold tracking-[0.2em] md:tracking-[0.3em] uppercase text-emerald-400 mb-2 md:mb-4 block">
                Secure Checkout
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                Checkout
              </h1>
              <p className="text-gray-400 text-sm md:text-base mt-2 md:mt-4">
                Complete your order in {3 - currentStep + 1} simple step{3 - currentStep + 1 > 1 ? 's' : ''}
              </p>
            </div>

            {/* Progress Indicators - Mobile: Compact, Desktop: Full */}
            <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-0">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="relative">
                    <motion.div
                      className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        currentStep >= step.id
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/30'
                          : 'bg-white/10 border-2 border-white/20'
                      }`}
                      initial={false}
                      animate={{
                        scale: currentStep === step.id ? 1.1 : 1
                      }}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      ) : (
                        <step.icon className={`w-4 h-4 md:w-5 md:h-5 ${currentStep >= step.id ? 'text-white' : 'text-white/50'}`} />
                      )}
                    </motion.div>

                    {/* Active Ring */}
                    {currentStep === step.id && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-emerald-400"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className="w-6 md:w-16 h-0.5 mx-1 md:mx-2 bg-white/20 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ transformOrigin: 'left' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 md:px-8 lg:px-16 xl:px-24 pb-16 md:pb-24">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-6 md:gap-8 lg:gap-12">
          {/* Form Section */}
          <motion.div
            ref={formRef}
            className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-5 sm:p-6 md:p-8 lg:p-10 order-2 lg:order-1"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-5 md:mb-8">
              Delivery Details
            </h2>

            <div className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold tracking-[0.2em] uppercase text-emerald-400">
                  Contact Information
                </h3>

                <div>
                  <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="John Smith"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="07XXX XXXXXX"
                    />
                    {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              <Separator className="my-8 bg-white/10" />

              {/* Delivery Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold tracking-[0.2em] uppercase text-emerald-400">
                  Delivery Address
                </h3>

                <div>
                  <Label htmlFor="addressLine1" className="text-gray-300">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={formData.address.line1}
                    onChange={(e) => handleInputChange('address.line1', e.target.value)}
                    className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.addressLine1 ? 'border-red-500' : ''}`}
                    placeholder="123 Golf Course Road"
                  />
                  {errors.addressLine1 && <p className="text-xs text-red-400 mt-1">{errors.addressLine1}</p>}
                </div>

                <div>
                  <Label htmlFor="addressLine2" className="text-gray-300">
                    Address Line 2 <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="addressLine2"
                    value={formData.address.line2}
                    onChange={(e) => handleInputChange('address.line2', e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-gray-300">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.city ? 'border-red-500' : ''}`}
                      placeholder="London"
                    />
                    {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <Label htmlFor="postcode" className="text-gray-300">Postcode</Label>
                    <Input
                      id="postcode"
                      value={formData.address.postcode}
                      onChange={(e) => handleInputChange('address.postcode', e.target.value)}
                      className={`mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 ${errors.postcode ? 'border-red-500' : ''}`}
                      placeholder="SW1A 1AA"
                    />
                    {errors.postcode && <p className="text-xs text-red-400 mt-1">{errors.postcode}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-300">Country</Label>
                  <Input
                    id="country"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    className="mt-1.5 bg-white/10 border-white/20 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinueToPayment}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-lg font-semibold transition-all duration-300 mt-8"
              >
                Continue to Payment
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div ref={summaryRef} className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-8 bg-[#303843] rounded-xl md:rounded-2xl p-5 sm:p-6 md:p-8 text-white">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 md:mb-6 border-b border-white/10 pb-3 md:pb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 max-h-[200px] md:max-h-[300px] overflow-y-auto scrollbar-hide">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 md:gap-4 pb-3 md:pb-4 border-b border-white/10 last:border-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.media ? (
                        <img src={item.media} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs md:text-sm truncate">{item.name}</p>
                      {(item.colour_hex || item.size) && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">
                          {item.colour_hex && (
                            <>
                              <span
                                className="inline-flex h-2.5 w-2.5 md:h-3 md:w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: item.colour_hex }}
                              />
                              <span className="capitalize truncate">{item.colour_name || 'Colour'}</span>
                            </>
                          )}
                          {item.size && (
                            <>
                              {item.colour_hex && <span>•</span>}
                              <span>Size: {item.size}</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-xs md:text-sm flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4 md:my-6 bg-white/10" />

              {/* Totals */}
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between text-xs md:text-sm text-white/80">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm text-white/80">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm text-white/80">
                  <span>VAT (20%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <Separator className="my-3 md:my-4 bg-white/10" />
                <div className="flex justify-between text-lg md:text-xl font-bold">
                  <span>Total</span>
                  <span className="text-emerald-400">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Free Shipping Badge */}
              {subtotal >= 50 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg"
                >
                  <p className="text-xs text-emerald-400 text-center">
                    🎉 You've qualified for FREE shipping!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default CheckoutPage
