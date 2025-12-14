import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronDown, ShoppingCart, Heart } from 'lucide-react'
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

const Navbar = () => {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeItem, setActiveItem] = useState('Home')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)

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

  return (
    <nav
      className={cn(
        'fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
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
          <div className="w-[137px] h-[34px] flex items-center justify-center relative">
            {/* Logo inverted/white - always visible for both transparent and dark backgrounds */}
            <img
              src="/logo-invert.png"
              alt="ASTARI"
              className="h-full w-auto object-contain transition-opacity duration-500"
            />
          </div>

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
            {/* Wishlist Icon */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative group p-2 rounded-full transition-all duration-300 hover:bg-white/5"
            >
              <Heart className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full shadow-lg animate-in fade-in zoom-in">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative group p-2 rounded-full transition-all duration-300 hover:bg-white/5"
            >
              <ShoppingCart className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full shadow-lg animate-in fade-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Wishlist Drawer */}
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </nav>
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
