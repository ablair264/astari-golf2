import { useState } from 'react'
import { Heart, ArrowRight, Eye, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BentoGrid = () => {
  return (
    <section className="w-full py-12 md:py-20 px-4 md:px-8 lg:px-16 xl:px-24 bg-white">
      <div className="max-w-[1200px] mx-auto">
        {/* Mobile: Stacked layout, Desktop: 4x4 Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 md:aspect-square">

          {/* Card 1: Premium Collection - Large (2x2 on all) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-2 row-span-2 aspect-square md:aspect-auto">
            <img
              src="/products/1.png"
              alt="Premium Collection"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />

            <div className="relative h-full p-4 md:p-8 flex flex-col justify-between">
              <div className="space-y-2 md:space-y-3">
                <span className="inline-block px-2 md:px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                  Premium Collection
                </span>
                <h2 className="text-white text-2xl md:text-5xl font-bold leading-tight">
                  Cord<br />Series
                </h2>
                <p className="text-gray-200 text-xs md:text-base max-w-sm hidden md:block">
                  Experience unmatched control with our signature cord texture technology. Engineered for all-weather performance.
                </p>
              </div>
              <Button
                className="self-start rounded-full bg-white text-black hover:bg-white/90 h-9 md:h-12 px-4 md:px-8 text-xs md:text-sm"
                onClick={() => console.log('Explore Collection')}
              >
                Explore
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
              </Button>
            </div>
          </div>

          {/* Card 2: Tour Collection - Tall (1x2) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-1 row-span-2 aspect-[1/2] md:aspect-auto">
            <img
              src="/products/2.png"
              alt="Tour Collection"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative h-full p-3 md:p-6 flex flex-col justify-end">
              <div className="space-y-1 md:space-y-2">
                <span className="block text-gray-300 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                  Tour Series
                </span>
                <h3 className="text-white text-base md:text-2xl font-bold">
                  Pro<br/>Performance
                </h3>
              </div>
              <Button
                variant="outline"
                className="mt-2 md:mt-4 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm h-8 md:h-10 text-xs md:text-sm"
                onClick={() => console.log('View Range')}
              >
                View Range
              </Button>
            </div>
          </div>

          {/* Card 3: Velvet Series - Medium (1x2) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-1 row-span-2 aspect-[1/2] md:aspect-auto">
            <img
              src="/products/3.png"
              alt="Velvet Series"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

            <div className="relative h-full p-3 md:p-6 flex flex-col justify-end">
              <h3 className="text-white text-base md:text-2xl font-bold">
                Velvet<br />Series
              </h3>
            </div>
          </div>

          {/* Card 4: Game Style Collection - Wide (2x1) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-2 row-span-1 bg-white p-3 md:p-6">
            <div className="h-full flex items-center justify-between gap-2">
              <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                <span className="block text-gray-500 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                  New Release
                </span>
                <h3 className="text-black text-sm md:text-3xl font-bold truncate md:whitespace-normal">
                  Game Style Collection
                </h3>
              </div>
              <Button
                className="rounded-full bg-black text-white hover:bg-gray-800 h-8 md:h-11 px-3 md:px-6 text-xs md:text-sm shrink-0"
                onClick={() => console.log('Discover Now')}
              >
                <Eye className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Discover Now</span>
              </Button>
            </div>
          </div>

          {/* Card 5: All-Weather Range - Medium (1x1) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-1 row-span-1 aspect-square md:aspect-auto">
            <img
              src="/products/1.png"
              alt="All-Weather Range"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative h-full p-3 md:p-5 flex flex-col justify-end">
              <span className="block text-white text-xs md:text-base font-bold">
                All-Weather<br />Range
              </span>
            </div>
          </div>

          {/* Card 6: Technology Feature - Medium (1x1) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-1 row-span-1 aspect-square md:aspect-auto bg-gradient-to-br from-[#282F38] to-[#1a1f26] p-3 md:p-5">
            <div className="h-full flex flex-col justify-between">
              <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white/80" />
              <div>
                <h4 className="text-white text-xs md:text-sm font-bold leading-tight">
                  Weather<br/>Tech
                </h4>
              </div>
            </div>
          </div>

          {/* Card 7: Enhanced Grip Technology - Extra Wide (2x1 mobile, 4x1 desktop) */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden col-span-2 md:col-span-4 row-span-1 bg-gradient-to-br from-gray-100 to-gray-200 p-3 md:p-6">
            <div className="h-full flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-black text-sm md:text-2xl font-bold mb-0.5 md:mb-1 truncate md:whitespace-normal">
                  Enhanced Grip Technology
                </h4>
                <p className="text-gray-600 text-[10px] md:text-sm truncate md:whitespace-normal">
                  Micro-texture surface for maximum control
                </p>
              </div>
              <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-gray-600 shrink-0" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default BentoGrid
