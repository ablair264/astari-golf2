import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const MobileFilterBar = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  brandOptions = [],
  selectedBrand,
  setSelectedBrand,
  priceRange,
  priceFilter,
  setPriceFilter,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 md:hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Category</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedCategory(null)
                onClose()
              }}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                !selectedCategory ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100'
              }`}
            >
              All Products
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.slug)
                  onClose()
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  selectedCategory === category.slug
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Brands */}
        {brandOptions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Brand</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedBrand(null)
                  onClose()
                }}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  !selectedBrand ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100'
                }`}
              >
                All Brands
              </button>
              {brandOptions.map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setSelectedBrand(brand)
                    onClose()
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    selectedBrand === brand
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <h3 className="font-medium mb-3">Price Range</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Min: £{priceFilter.min}</label>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={priceFilter.min}
                onChange={(e) => setPriceFilter(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Max: £{priceFilter.max}</label>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={priceFilter.max}
                onChange={(e) => setPriceFilter(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700"
        >
          Apply Filters
        </button>
      </motion.div>
    </motion.div>
  )
}

export default MobileFilterBar
