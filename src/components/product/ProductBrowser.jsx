import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Search, X, Filter, Grid3x3, List, ChevronDown } from 'lucide-react'
import { getAllProducts, getCategories, getPriceRange } from '@/services/products'
import { useCart } from '@/contexts/CartContext'
import ProductCard from './ProductCard'
import MobileFilterBar from './MobileFilterBar'
import MobileRowCard from './MobileRowCard'
import MobileProductSheet from './MobileProductSheet'

const ProductBrowser = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [priceFilter, setPriceFilter] = useState({ min: 0, max: 1000 })
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const navigate = useNavigate()

  const { addToCart } = useCart()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
    const [productsData, categoriesData, priceData] = await Promise.all([
      getAllProducts(),
      getCategories(),
      getPriceRange()
    ])

    setProducts(productsData)
    setCategories(categoriesData)

        const minPrice = Math.floor(parseFloat(priceData.min_price) || 0)
        const maxPrice = Math.ceil(parseFloat(priceData.max_price) || 1000)
        setPriceRange({ min: minPrice, max: maxPrice })
        setPriceFilter({ min: minPrice, max: maxPrice })
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Track viewport for mobile-specific UI (sheets, behavior)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setViewMode('grid')
    } else {
      setViewMode('list')
    }
  }, [isMobile])

  useEffect(() => {
    if (!isMobile) {
      setViewMode('list')
    } else {
      setViewMode('grid')
    }
  }, [isMobile])

  // Group variants by style_no (or id fallback) so style_no acts as a product grouping key
  const groupedProducts = useMemo(() => {
    const map = new Map()

    products.forEach(prod => {
      const key = prod.style_no || prod.id
      if (!map.has(key)) {
        map.set(key, { variants: [], colours: [] })
      }
      const entry = map.get(key)
      entry.variants.push(prod)

      if (prod.colour_hex || prod.colour_name) {
        const exists = entry.colours.find(c => c.colour_hex === prod.colour_hex && c.colour_name === prod.colour_name)
        if (!exists) {
          entry.colours.push({ colour_hex: prod.colour_hex, colour_name: prod.colour_name })
        }
      }
    })

    return Array.from(map.entries()).map(([key, entry]) => {
      const primary = entry.variants[0]
      const prices = entry.variants.map(v => parseFloat(v.price)).filter(p => !Number.isNaN(p))
      const priceMin = prices.length ? Math.min(...prices) : primary.price
      const priceMax = prices.length ? Math.max(...prices) : primary.price
      const totalStock = entry.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)

      return {
        ...primary,
        id: primary.id, // use primary variant id for add-to-cart
        style_no: key,
        price_min: priceMin,
        price_max: priceMax,
        total_stock: totalStock,
        colours: entry.colours,
        variants: entry.variants,
      }
    })
  }, [products])

  const brandOptions = useMemo(() => {
    const unique = new Set()
    groupedProducts.forEach(p => {
      if (p.brand_name) unique.add(p.brand_name)
    })
    return Array.from(unique)
  }, [groupedProducts])

  const filteredProducts = groupedProducts.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || product.category_slug === selectedCategory

    const price = parseFloat(product.price_min ?? product.price)
    const matchesPrice = price >= priceFilter.min && price <= priceFilter.max

    const matchesBrand = !selectedBrand || product.brand_name === selectedBrand

    return matchesSearch && matchesCategory && matchesPrice && matchesBrand
  })

  const handleAddToCart = (product, variant) => {
    const chosen = variant || product.variants?.[0] || product
    addToCart(chosen, 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading products...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d121a] via-[#0f141d] to-[#0b1017] text-white pt-24 md:pt-28">
      {/* Hero / Header */}
      <div className="sticky top-0 z-30 backdrop-blur bg-[#0d121a]/85 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Astari Product Browser</p>
              <h1 className="text-2xl font-bold text-white">Performance gear, refined</h1>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-full px-2 py-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]' : 'text-white/70 hover:text-white'}`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]' : 'text-white/70 hover:text-white'}`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <div className="hidden lg:flex items-center text-xs text-white/60 pl-3">{filteredProducts.length} items</div>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-full border border-white/15 bg-white/5 text-white"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search golf products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter pills not needed on desktop; rely on sidebar. Kept hidden. */}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar filters (desktop) */}
          <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur sticky top-24 self-start">
            <FilterSection title="Category">
              <div className="space-y-2">
                <SidebarOption
                  label="All products"
                  active={!selectedCategory}
                  onClick={() => setSelectedCategory(null)}
                />
                {categories.map(category => (
                  <SidebarOption
                    key={category.id}
                    label={category.name}
                    active={selectedCategory === category.slug}
                    onClick={() => setSelectedCategory(category.slug)}
                  />
                ))}
              </div>
            </FilterSection>

            {brandOptions.length > 0 && (
              <FilterSection title="Brand">
                <div className="space-y-2">
                  <SidebarOption
                    label="All brands"
                    active={!selectedBrand}
                    onClick={() => setSelectedBrand(null)}
                  />
                  {brandOptions.map(brand => (
                    <SidebarOption
                      key={brand}
                      label={brand}
                      active={selectedBrand === brand}
                      onClick={() => setSelectedBrand(brand)}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            <FilterSection title="Price">
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-white/50">Min</label>
                    <input
                      type="number"
                      value={priceFilter.min}
                      min={priceRange.min}
                      max={priceFilter.max}
                      onChange={(e) => setPriceFilter(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-white/50">Max</label>
                    <input
                      type="number"
                      value={priceFilter.max}
                      min={priceFilter.min}
                      max={priceRange.max}
                      onChange={(e) => setPriceFilter(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="text-xs text-white/50">Range £{priceRange.min} - £{priceRange.max}</div>
              </div>
            </FilterSection>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Showing {filteredProducts.length} products</span>
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white'}`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <LayoutGroup>
              <motion.div
                layout
                className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6'
                      : 'flex flex-col gap-4'
                }
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(product => (
                    viewMode === 'grid' ? (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onClick={() => setSelectedProduct(product)}
                      />
                    ) : (
                      <ExpandedRow
                        key={product.id}
                        product={product}
                        expanded={expandedId === product.id}
                        onExpand={() => setExpandedId(product.id)}
                        onCollapse={() => setExpandedId(null)}
                        dimmed={expandedId && expandedId !== product.id}
                        onAddToCart={handleAddToCart}
                        onSelectVariant={(v) => handleAddToCart(product, v)}
                        onDetails={() => navigate(`/products/${product.slug || product.id}`)}
                      />
                    )
                  ))}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <p className="text-white/70">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <MobileFilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          brandOptions={brandOptions}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          priceRange={priceRange}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Mobile Product Sheet */}
      {isMobile && selectedProduct && (
        <MobileProductSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  )
}

export default ProductBrowser

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all border ${
      active
        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.25)]'
        : 'bg-white/5 border-white/10 text-white/80 hover:border-white/30'
    }`}
  >
    {label}
  </button>
)

const FilterSection = ({ title, children }) => {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-white/5 last:border-none py-3">
      <button
        className="w-full flex items-center justify-between text-sm font-semibold text-white"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SidebarOption = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
      active
        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)]'
        : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/0'
    }`}
  >
    {label}
  </button>
)

const ExpandedRow = ({ product, onAddToCart, onSelectVariant, expanded, onExpand, onCollapse, onDetails, dimmed }) => {
  const variants = product.variants || [product]
  const [activeVariantId, setActiveVariantId] = useState(variants[0]?.id)
  const activeVariant = useMemo(
    () => variants.find((v) => v.id === activeVariantId) || variants[0] || product,
    [variants, activeVariantId, product]
  )
  const price = activeVariant.price ?? product.price_min ?? product.price
  const image = activeVariant.image_url || product.image_url || '/products/1.png'

  return (
    <motion.div
      layout
      className={`relative p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#111827] via-[#0e141e] to-[#0b1017] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition-all ${expanded ? '' : 'hover:border-white/20 cursor-pointer'}`}
      onClick={!expanded ? onExpand : undefined}
    >
      {dimmed && <div className="absolute inset-0 bg-black/40 rounded-2xl pointer-events-none" />}
      {expanded ? (
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 md:gap-6 items-center">
          <div className="relative rounded-xl overflow-hidden bg-black/10 border border-white/10 aspect-[4/3]">
            <img
              src={image}
              alt={activeVariant.name || product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onCollapse?.() }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
            {product.colours?.length > 0 && (
              <div className="absolute top-3 left-3 flex gap-1">
                {product.colours.slice(0, 5).map((c, idx) => (
                  <span
                    key={`${c.colour_hex}-${idx}`}
                    className="inline-flex h-4 w-4 rounded-full border border-black/30 shadow"
                    title={c.colour_name || 'Colour'}
                    style={{ backgroundColor: c.colour_hex || '#e5e7eb' }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-300 uppercase tracking-[0.14em]">
              {product.brand_logo && (
                <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/80">
                  <img
                    src={product.brand_logo}
                    alt={product.brand_name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </span>
              )}
              <span>{product.brand_name}</span>
              {product.style_no && <span className="text-white/60">Style {product.style_no}</span>}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white truncate">{product.name}</h3>
                {product.category_name && (
                  <p className="text-sm text-white/60">{product.category_name}</p>
                )}
              </div>
              <div className="text-2xl font-bold text-white whitespace-nowrap">
                {cartUtils.formatPrice(parseFloat(price))}
              </div>
            </div>

            {product.colours?.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/70 flex-wrap">
                <span className="text-white/60">Colours:</span>
                {product.colours.slice(0, 6).map((c, idx) => (
                  <button
                    key={`${c.colour_hex}-${idx}`}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${
                      activeVariant.colour_hex === c.colour_hex || activeVariant.colour_name === c.colour_name
                        ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
                        : 'bg-white/5 border-white/10 hover:border-emerald-400/60 text-white/80'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      const match = variants.find(v => v.colour_hex === c.colour_hex || v.colour_name === c.colour_name)
                      if (match) {
                        setActiveVariantId(match.id)
                        onSelectVariant?.(match)
                      }
                    }}
                  >
                    <span className="inline-flex h-3.5 w-3.5 rounded-full border border-black/30" style={{ backgroundColor: c.colour_hex || '#e5e7eb' }} />
                    <span className="capitalize text-white/80">{c.colour_name || 'Colour'}</span>
                  </button>
                ))}
                {product.colours.length > 6 && (
                  <span className="text-[11px] text-white/50">+{product.colours.length - 6}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(activeVariant) }}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-600 shadow-lg"
              >
                Add to Cart
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDetails?.() }}
                className="px-4 py-3 rounded-lg border border-white/15 text-white hover:border-white/40"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-colors" onClick={onExpand}>
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-black/10 border border-white/10 flex-shrink-0">
            <img src={image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-white/70 uppercase tracking-[0.12em]">
              <span>{product.brand_name}</span>
              {product.style_no && <span className="text-white/50">Style {product.style_no}</span>}
            </div>
            <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
            <div className="text-sm text-white/60">{product.category_name}</div>
            <div className="text-white font-bold">{cartUtils.formatPrice(parseFloat(price))}</div>
          </div>
          <button className="px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-100 text-sm" onClick={(e) => { e.stopPropagation(); onExpand?.() }}>
            Expand
          </button>
        </div>
      )}
    </motion.div>
  )
}
