import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronDown, ShoppingCart, Heart, Menu, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import CartDrawer from '@/components/CartDrawer'
import WishlistDrawer from '@/components/WishlistDrawer'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeItem, setActiveItem] = useState('Home')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { itemCount } = useCart()
  const { wishlistCount } = useWishlist()

  const navItems = [
    { name: 'Home', href: '/', isRoute: true },
    { name: 'Shop', href: '/products', isRoute: true },
    { name: 'Grips', href: '#grips' },
    {
      name: 'Brands',
      href: '#brands',
      dropdown: ['Astari', 'Lamkin', 'Iguana', 'GripShift', 'Kola']
    },
    { name: 'Clubs', href: '#clubs' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determine if scrolled from top
      setScrolled(currentScrollY > 50)

      // Show/hide navbar based on scroll direction
      if (currentScrollY < 50) {
        // At top - always show
        setVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide
        setVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close mobile menu on navigation
  const handleNavClick = (item) => {
    setActiveItem(item.name)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out w-[calc(100%-2rem)] md:w-auto max-w-[900px]',
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        {/* Mobile Navbar */}
        <div className="md:hidden relative">
          <div className={cn(
            'flex items-center justify-between h-12 px-4 rounded-full transition-all duration-500',
            scrolled ? 'bg-[#282F38] shadow-2xl' : 'bg-[#282F38]/90 backdrop-blur-md'
          )}>
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="h-7">
              <img
                src="/logo-invert.png"
                alt="ASTARI"
                className="h-full w-auto object-contain"
              />
            </Link>

            {/* Cart/Wishlist Icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2 text-white"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white bg-emerald-500 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-white"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white bg-emerald-500 rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden md:block relative">
          <div className="relative flex items-center justify-center">
            {/* Background pill */}
            <div
              className={cn(
                'absolute inset-0 rounded-full transition-all duration-500',
                'w-[900px] h-[48px]',
                scrolled ? 'bg-[#282F38] shadow-2xl' : 'bg-transparent',
              )}
            />

            {/* Navigation items */}
            <div className="relative flex items-center justify-between w-[900px] h-[48px] px-3">
              {/* Left nav items */}
              {navItems.slice(0, 3).map((item) => (
                <NavItem
                  key={item.name}
                  name={item.name}
                  href={item.href}
                  isActive={activeItem === item.name}
                  isScrolled={scrolled}
                  onClick={() => setActiveItem(item.name)}
                  dropdown={item.dropdown}
                  navigate={navigate}
                  isRoute={item.isRoute}
                />
              ))}

              {/* Logo in center */}
              <Link to="/" className="w-[137px] h-[34px] flex items-center justify-center relative">
                <img
                  src="/logo-invert.png"
                  alt="ASTARI"
                  className="h-full w-auto object-contain transition-opacity duration-500"
                />
              </Link>

              {/* Right nav items */}
              {navItems.slice(3).map((item) => (
                <NavItem
                  key={item.name}
                  name={item.name}
                  href={item.href}
                  isActive={activeItem === item.name}
                  isScrolled={scrolled}
                  onClick={() => setActiveItem(item.name)}
                  dropdown={item.dropdown}
                  navigate={navigate}
                  isRoute={item.isRoute}
                />
              ))}

              {/* Cart and Wishlist Icons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setIsWishlistOpen(true)}
                  className="relative group p-2 rounded-full transition-all duration-300 hover:bg-white/5"
                >
                  <Heart className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full shadow-lg">
                      {wishlistCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative group p-2 rounded-full transition-all duration-300 hover:bg-white/5"
                >
                  <ShoppingCart className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full shadow-lg">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute left-0 top-0 h-full w-72 bg-[#1a1f26] shadow-2xl"
            >
              <div className="p-6 pt-20">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <div key={item.name}>
                      {item.isRoute ? (
                        <Link
                          to={item.href}
                          onClick={() => handleNavClick(item)}
                          className={cn(
                            'block px-4 py-3 rounded-xl text-lg font-medium transition-colors',
                            activeItem === item.name
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-white hover:bg-white/5'
                          )}
                        >
                          {item.name}
                        </Link>
                      ) : item.dropdown ? (
                        <div className="space-y-1">
                          <div className="px-4 py-3 text-lg font-medium text-white">
                            {item.name}
                          </div>
                          <div className="pl-4 space-y-1">
                            {item.dropdown.map((brand) => (
                              <Link
                                key={brand}
                                to={`/collections/${brand.toLowerCase()}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                {brand}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleNavClick(item)}
                          className={cn(
                            'block w-full text-left px-4 py-3 rounded-xl text-lg font-medium transition-colors',
                            activeItem === item.name
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-white hover:bg-white/5'
                          )}
                        >
                          {item.name}
                        </button>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Wishlist Drawer */}
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </>
  )
}

const NavItem = ({ name, href, isActive, isScrolled, onClick, dropdown, navigate, isRoute }) => {
  if (dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'relative w-[112px] h-[34px] flex items-center justify-center gap-1',
              'text-base font-albert-sans transition-all duration-300 ease-out',
              'group cursor-pointer outline-none'
            )}
          >
            {/* Text */}
            <span
              className={cn(
                'relative z-10 transition-all duration-300 text-white',
                isActive && 'font-semibold'
              )}
            >
              {name}
            </span>
            <ChevronDown className="w-3 h-3 text-white transition-transform duration-300 group-data-[state=open]:rotate-180" />

            {/* Hover effect - subtle underline */}
            <div
              className={cn(
                'absolute bottom-2 left-1/2 -translate-x-1/2 h-[1px] w-0',
                'transition-all duration-300 ease-out',
                'group-hover:w-8 bg-white'
              )}
            />

            {/* Active indicator - small dot */}
            {isActive && (
              <div
                className={cn(
                  'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  'transition-colors duration-300 bg-white'
                )}
              />
            )}

            {/* Subtle hover background */}
            <div
              className={cn(
                'absolute inset-0 rounded-full opacity-0 transition-opacity duration-300',
                'group-hover:opacity-5 bg-white'
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className={cn(
            'mt-2 min-w-[160px] rounded-2xl border',
            isScrolled
              ? 'bg-[#303843] border-white/10'
              : 'bg-black/80 backdrop-blur-md border-white/20'
          )}
        >
          {dropdown.map((brand) => (
            <DropdownMenuItem
              key={brand}
              className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-xl transition-colors duration-200"
              onClick={() => {
                navigate(`/collections/${brand.toLowerCase()}`)
              }}
            >
              {brand}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const LinkWrapper = isRoute ? Link : 'a'
  const linkProps = isRoute
    ? { to: href, onClick: onClick }
    : { href: href, onClick: (e) => { e.preventDefault(); onClick(); } }

  return (
    <LinkWrapper
      {...linkProps}
      className={cn(
        'relative w-[112px] h-[34px] flex items-center justify-center',
        'text-base font-albert-sans transition-all duration-300 ease-out',
        'group cursor-pointer'
      )}
    >
      {/* Text */}
      <span
        className={cn(
          'relative z-10 transition-all duration-300 text-white',
          isActive && 'font-semibold'
        )}
      >
        {name}
      </span>

      {/* Hover effect - subtle underline */}
      <div
        className={cn(
          'absolute bottom-2 left-1/2 -translate-x-1/2 h-[1px] w-0',
          'transition-all duration-300 ease-out',
          'group-hover:w-8 bg-white'
        )}
      />

      {/* Active indicator - small dot */}
      {isActive && (
        <div
          className={cn(
            'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
            'transition-colors duration-300 bg-white'
          )}
        />
      )}

      {/* Subtle hover background */}
      <div
        className={cn(
          'absolute inset-0 rounded-full opacity-0 transition-opacity duration-300',
          'group-hover:opacity-5 bg-white'
        )}
      />
    </LinkWrapper>
  )
}

export default Navbar
