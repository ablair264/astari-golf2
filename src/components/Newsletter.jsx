import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle newsletter signup
    console.log('Newsletter signup:', email)
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail('')
    }, 3000)
  }

  return (
    <section className="relative w-full py-24 md:py-32 px-4 md:px-8 lg:px-16 xl:px-24 bg-[#303843] overflow-hidden">
      {/* Pattern Background Overlay */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'url(/pattern.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }}
      />

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />

      <div className="max-w-[900px] mx-auto relative z-10">
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="inline-flex">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Mail className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Stay in the Game
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Get exclusive access to new releases, pro tips, and special offers.
              Join our community of champions.
            </p>
          </div>

          {/* Form */}
          {!isSubmitted ? (
            <form
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto mt-8"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Privacy Notice */}
              <p className="text-xs text-gray-500 mt-4">
                By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
              </p>
            </form>
          ) : (
            <div className="max-w-xl mx-auto mt-8 p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <p className="text-white text-lg font-semibold">
                ✓ Thank you for subscribing!
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Check your inbox for exclusive updates.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-white font-semibold mb-1">Exclusive Drops</div>
              <div className="text-sm text-gray-500">Be first to new releases</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold mb-1">Pro Tips</div>
              <div className="text-sm text-gray-500">Expert advice weekly</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold mb-1">Special Offers</div>
              <div className="text-sm text-gray-500">Subscriber-only deals</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
