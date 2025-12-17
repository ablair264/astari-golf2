import { cn } from '@/lib/utils'

// Group variants by attribute type
const groupVariantsByAttribute = (variants, attribute) => {
  const groups = {}
  variants.forEach((variant) => {
    const value = variant[attribute]
    if (value && !groups[value]) {
      groups[value] = variant
    }
  })
  return Object.values(groups)
}

// Color Selector
export const ColorSelector = ({
  variants = [],
  selectedVariant,
  onSelect,
  label = 'Colour',
}) => {
  // Group by colour_name to avoid duplicates
  const colorVariants = groupVariantsByAttribute(variants, 'colour_name')

  if (colorVariants.length <= 1) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {selectedVariant?.colour_name && (
          <span className="text-sm text-gray-500">{selectedVariant.colour_name}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {colorVariants.map((variant) => {
          const isSelected = selectedVariant?.colour_name === variant.colour_name
          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className={cn(
                'relative w-10 h-10 rounded-full border-2 transition-all',
                isSelected
                  ? 'border-gray-900 ring-2 ring-gray-900/20'
                  : 'border-gray-200 hover:border-gray-400'
              )}
              title={variant.colour_name}
            >
              <span
                className="absolute inset-1 rounded-full"
                style={{ backgroundColor: variant.colour_hex || '#cccccc' }}
              />
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-300" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Size Selector
export const SizeSelector = ({
  variants = [],
  selectedVariant,
  onSelect,
  label = 'Size',
  sizeAttribute = 'size',
}) => {
  // Group by size to avoid duplicates
  const sizeVariants = groupVariantsByAttribute(variants, sizeAttribute)

  if (sizeVariants.length <= 1) return null

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {sizeVariants.map((variant) => {
          const sizeValue = variant[sizeAttribute]
          const isSelected = selectedVariant?.[sizeAttribute] === sizeValue
          const isOutOfStock = variant.stock_quantity === 0

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onSelect(variant)}
              disabled={isOutOfStock}
              className={cn(
                'min-w-[3rem] px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                isSelected
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : isOutOfStock
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
              )}
            >
              {sizeValue}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Core Size Selector (specific to golf grips)
export const CoreSizeSelector = ({
  variants = [],
  selectedVariant,
  onSelect,
  label = 'Core Size',
}) => {
  // Group by core_size to avoid duplicates
  const coreVariants = groupVariantsByAttribute(variants, 'core_size')

  if (coreVariants.length <= 1) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">(shaft diameter)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {coreVariants.map((variant) => {
          const isSelected = selectedVariant?.core_size === variant.core_size
          const isOutOfStock = variant.stock_quantity === 0

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onSelect(variant)}
              disabled={isOutOfStock}
              className={cn(
                'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                isSelected
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : isOutOfStock
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
              )}
            >
              {variant.core_size}"
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Combined Variant Selector that auto-detects available options
const VariantSelector = ({
  variants = [],
  selectedVariant,
  onSelect,
}) => {
  if (!variants || variants.length <= 1) return null

  // Detect which attributes have multiple values
  const hasColors = new Set(variants.map(v => v.colour_name).filter(Boolean)).size > 1
  const hasSizes = new Set(variants.map(v => v.size).filter(Boolean)).size > 1
  const hasCoreSizes = new Set(variants.map(v => v.core_size).filter(Boolean)).size > 1

  return (
    <div className="space-y-5">
      {hasColors && (
        <ColorSelector
          variants={variants}
          selectedVariant={selectedVariant}
          onSelect={onSelect}
        />
      )}
      {hasSizes && (
        <SizeSelector
          variants={variants}
          selectedVariant={selectedVariant}
          onSelect={onSelect}
        />
      )}
      {hasCoreSizes && (
        <CoreSizeSelector
          variants={variants}
          selectedVariant={selectedVariant}
          onSelect={onSelect}
        />
      )}
    </div>
  )
}

export default VariantSelector
