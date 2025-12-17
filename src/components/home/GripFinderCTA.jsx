import { useState } from 'react'
import { Crosshair, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GripSelectorModal } from '@/components/product/GripSizer'

const GripFinderCTA = () => {
  const [isGripSizerOpen, setIsGripSizerOpen] = useState(false)

  return (
    <>
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-gradient-to-br from-[#1a1f27] to-[#0f1621] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600/20 to-emerald-400/10 border border-emerald-500/20 p-8 md:p-12 lg:p-16 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-2xl" />
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center backdrop-blur-sm">
                    <Crosshair className="w-12 h-12 md:w-16 md:h-16 text-emerald-400" strokeWidth={1} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block text-emerald-400 text-sm font-medium tracking-wider uppercase mb-3">
                  Interactive Tool
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Find Your Perfect Grip
                </h2>
                <p className="text-gray-400 mt-4 text-lg max-w-xl">
                  Use our GripSizer tool to discover the ideal grip for your game.
                  Answer a few questions and we'll match you with the perfect feel and performance.
                </p>

                {/* Features */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6">
                  <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                    Hand Size Analysis
                  </span>
                  <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                    Swing Style Match
                  </span>
                  <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                    Personalized Results
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <Button
                  onClick={() => setIsGripSizerOpen(true)}
                  size="lg"
                  className="rounded-full px-8 py-6 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 flex items-center gap-2"
                >
                  Launch GripFinder
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GripSizer Modal */}
      <GripSelectorModal
        isOpen={isGripSizerOpen}
        onClose={() => setIsGripSizerOpen(false)}
      />
    </>
  )
}

export default GripFinderCTA
