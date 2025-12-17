import { useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

const ImageGallery = ({ images = [], productName = 'Product' }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  // Ensure we have at least one image
  const galleryImages = images.length > 0 ? images : ['/images/placeholder.png']
  const currentImage = galleryImages[selectedIndex]

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }, [galleryImages.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }, [galleryImages.length])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') setIsLightboxOpen(false)
  }, [handlePrevious, handleNext])

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={currentImage}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </div>

        {/* Navigation arrows for main image */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {galleryImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {selectedIndex + 1} / {galleryImages.length}
          </div>

          {/* Main lightbox image */}
          <div
            className={cn(
              'relative max-w-[90vw] max-h-[85vh] transition-transform duration-300',
              isZoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'
            )}
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomed(!isZoomed)
            }}
          >
            <img
              src={currentImage}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Navigation arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                  setIsZoomed(false)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                  setIsZoomed(false)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-7 h-7 text-white" />
              </button>
            </>
          )}

          {/* Thumbnail strip in lightbox */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-xl backdrop-blur-sm">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                    setIsZoomed(false)
                  }}
                  className={cn(
                    'w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                    selectedIndex === index
                      ? 'border-white'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
