import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import CollectionPage from '@/pages/CollectionPage'
import CartPage from '@/pages/CartPage'
import ProductDetailsPage from '@/pages/ProductDetailsPage'
import ProductsPage from '@/pages/ProductsPage'
import CheckoutPage from '@/pages/CheckoutPage'
import PaymentPage from '@/pages/PaymentPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminProducts from '@/pages/AdminProducts'
import AdminBrands from '@/pages/AdminBrands'
import AdminMargins from '@/pages/AdminMargins'
import AdminLogin from '@/pages/AdminLogin'
import AdminCustomers from '@/pages/AdminCustomers'
import AdminCustomerMap from '@/pages/AdminCustomerMap'
import AdminLiveChat from '@/pages/AdminLiveChat'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import UnifiedChatWidget from '@/components/UnifiedChatWidget'

// Sample product data
const sampleProducts = [
  // Grips
  {
    id: 1,
    name: 'Cord Grip',
    brand: 'ASTARI',
    price: '16.99',
    inStock: true,
    category: 'Grips',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Premium cord grip designed for optimal control and feel in all weather conditions. Features a classic texture that provides excellent traction without sacrificing comfort.',
    materials: 'Synthetic rubber compound with cotton cord weave',
    gallery: ['/products/1.png', '/products/2.png', '/products/3.png', '/products/1.png']
  },
  {
    id: 2,
    name: 'Cord Grip Pro',
    brand: 'ASTARI',
    price: '18.99',
    inStock: true,
    category: 'Grips',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Enhanced version of our classic cord grip with reinforced durability and improved moisture-wicking properties. Perfect for competitive play.',
    materials: 'Advanced rubber blend with reinforced cord pattern',
    gallery: ['/products/2.png', '/products/3.png', '/products/1.png', '/products/2.png']
  },
  {
    id: 3,
    name: 'Performance Grip',
    brand: 'ASTARI',
    price: '16.99',
    inStock: true,
    category: 'Grips',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'High-performance grip engineered for consistency and control. Soft yet durable construction ensures long-lasting comfort round after round.',
    materials: 'Premium synthetic rubber with micro-texture surface',
    gallery: ['/products/3.png', '/products/1.png', '/products/2.png', '/products/3.png']
  },
  {
    id: 10,
    name: 'Velvet Grip',
    brand: 'ASTARI',
    price: '14.99',
    inStock: true,
    category: 'Grips',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Soft velvet finish provides exceptional comfort and a smooth feel. Ideal for players who prefer a softer grip without compromising control.',
    materials: 'Soft rubber compound with velvet texture finish'
  },
  {
    id: 11,
    name: 'All-Weather Grip',
    brand: 'ASTARI',
    price: '17.99',
    inStock: true,
    category: 'Grips',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Designed to perform in any conditions, rain or shine. Advanced moisture management technology keeps your grip secure throughout your round.',
    materials: 'Weather-resistant rubber with hydrophobic coating'
  },
  {
    id: 12,
    name: 'Tour Velvet',
    brand: 'ASTARI',
    price: '19.99',
    inStock: true,
    category: 'Grips',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Tour-proven velvet grip trusted by professionals worldwide. Combines the perfect balance of comfort, feel, and performance for competitive play.',
    materials: 'Premium rubber with tour-grade velvet coating'
  },
  // Bags
  {
    id: 4,
    name: 'Tour Bag',
    brand: 'ASTARI',
    price: '199.99',
    inStock: true,
    category: 'Bags',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Professional-grade tour bag with spacious 14-way top divider and multiple storage pockets. Built to withstand the rigors of tournament play while keeping your equipment organized.',
    materials: 'Durable nylon with reinforced bottom and premium leather accents'
  },
  {
    id: 5,
    name: 'Stand Bag',
    brand: 'ASTARI',
    price: '149.99',
    inStock: true,
    category: 'Bags',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Lightweight stand bag perfect for walking the course. Features an easy-deploy stand mechanism and ergonomic dual strap system for comfortable carrying.',
    materials: 'Lightweight polyester with aluminum stand frame'
  },
  {
    id: 13,
    name: 'Cart Bag',
    brand: 'ASTARI',
    price: '179.99',
    inStock: true,
    category: 'Bags',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Designed specifically for cart use with a stable base and convenient pocket placement. Features cart-friendly construction and ample storage for all your golf essentials.',
    materials: 'Heavy-duty polyester with reinforced cart strap channels'
  },
  {
    id: 14,
    name: 'Carry Bag',
    brand: 'ASTARI',
    price: '129.99',
    inStock: true,
    category: 'Bags',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Ultra-lightweight carry bag for minimalist golfers. Streamlined design with essential pockets and comfortable single strap system.',
    materials: 'Ripstop nylon with padded shoulder strap'
  },
  {
    id: 15,
    name: 'Travel Cover',
    brand: 'ASTARI',
    price: '89.99',
    inStock: true,
    category: 'Bags',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Protective travel cover with padded construction to safeguard your clubs during transport. Features heavy-duty wheels and multiple handles for easy maneuvering.',
    materials: 'Padded nylon with reinforced corners and inline skate wheels'
  },
  {
    id: 16,
    name: 'Staff Bag',
    brand: 'ASTARI',
    price: '249.99',
    inStock: true,
    category: 'Bags',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Premium staff bag designed for ultimate organization and style. Full-length dividers and oversized pockets make this the choice of tour professionals.',
    materials: 'Premium leather and nylon with chrome hardware accents'
  },
  // Clubs
  {
    id: 6,
    name: 'Driver',
    brand: 'ASTARI',
    price: '299.99',
    inStock: true,
    category: 'Clubs',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'High-performance driver engineered for maximum distance and forgiveness. Advanced aerodynamic head design and adjustable loft settings help you optimize launch conditions.',
    materials: 'Titanium face with carbon fiber crown and adjustable hosel'
  },
  {
    id: 7,
    name: 'Iron Set',
    brand: 'ASTARI',
    price: '599.99',
    inStock: true,
    category: 'Clubs',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Precision-forged iron set (5-PW) offering exceptional feel and control. Progressive design optimizes performance throughout the set for consistent ball flight and distance gaps.',
    materials: 'Forged carbon steel with tungsten weighting'
  },
  {
    id: 17,
    name: 'Fairway Wood',
    brand: 'ASTARI',
    price: '249.99',
    inStock: true,
    category: 'Clubs',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Versatile fairway wood designed for easy launch from any lie. Low center of gravity and flexible face technology deliver distance and consistency off the deck.',
    materials: 'Stainless steel with carbon fiber sole plate'
  },
  {
    id: 18,
    name: 'Hybrid',
    brand: 'ASTARI',
    price: '179.99',
    inStock: true,
    category: 'Clubs',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Easy-to-hit hybrid that bridges the gap between fairway woods and long irons. High launch and forgiving design make it ideal for approach shots and tee shots on tight holes.',
    materials: 'Maraging steel face with internal tungsten weighting'
  },
  {
    id: 19,
    name: 'Putter',
    brand: 'ASTARI',
    price: '149.99',
    inStock: true,
    category: 'Clubs',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Tour-inspired blade putter with precision milled face for consistent roll and feel. Classic design provides optimal alignment and weight distribution for confident putting.',
    materials: '303 stainless steel with precision milled face'
  },
  {
    id: 20,
    name: 'Wedge Set',
    brand: 'ASTARI',
    price: '279.99',
    inStock: true,
    category: 'Clubs',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Complete wedge set (52°, 56°, 60°) designed for maximum spin and control around the greens. Tour-proven groove design ensures consistent performance from any lie.',
    materials: 'Soft carbon steel with CNC milled grooves'
  },
  // Balls
  {
    id: 8,
    name: 'Pro V1',
    brand: 'ASTARI',
    price: '44.99',
    inStock: true,
    category: 'Balls',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Tour-level performance ball designed for complete players. Features soft feel, low spin off the driver, and exceptional greenside control with penetrating ball flight.',
    materials: 'Multi-layer construction with urethane cover'
  },
  {
    id: 9,
    name: 'Distance Balls',
    brand: 'ASTARI',
    price: '34.99',
    inStock: true,
    category: 'Balls',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'High-energy core construction delivers maximum distance off the tee. Durable ionomer cover provides long-lasting performance at an exceptional value.',
    materials: 'Two-piece construction with ionomer cover'
  },
  {
    id: 21,
    name: 'Tour Soft',
    brand: 'ASTARI',
    price: '39.99',
    inStock: true,
    category: 'Balls',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Premium soft-feel ball that combines distance with excellent control. Advanced core technology provides soft compression without sacrificing ball speed.',
    materials: 'Three-piece construction with soft ionomer cover'
  },
  {
    id: 22,
    name: 'Control Elite',
    brand: 'ASTARI',
    price: '42.99',
    inStock: true,
    category: 'Balls',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Designed for players who prioritize spin and control around the greens. Tour-level urethane cover provides exceptional feel and workability for shot shaping.',
    materials: 'Four-piece construction with soft urethane cover'
  },
  {
    id: 23,
    name: 'Super Range',
    brand: 'ASTARI',
    price: '29.99',
    inStock: true,
    category: 'Balls',
    media: '/products/2.png',
    mediaType: 'image',
    description: 'Value-oriented ball perfect for practice and casual rounds. Durable construction ensures consistent performance and long-lasting playability.',
    materials: 'Two-piece construction with durable surlyn cover'
  },
  {
    id: 24,
    name: 'Premium Tour',
    brand: 'ASTARI',
    price: '49.99',
    inStock: true,
    category: 'Balls',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'Ultimate performance ball used by tour professionals worldwide. Multi-layer construction provides optimal launch, spin control, and exceptional feel on every shot.',
    materials: 'Five-piece construction with tour-grade urethane cover'
  }
]

function App() {
  return (
    <AdminAuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <Routes>
          {/* Home Page */}
          <Route path="/" element={<HomePage />} />

          {/* Products */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />

          {/* Cart & Checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <ProtectedRoute>
                <AdminBrands />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/margins"
            element={
              <ProtectedRoute>
                <AdminMargins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute>
                <AdminCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers/map"
            element={
              <ProtectedRoute>
                <AdminCustomerMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/livechat"
            element={
              <ProtectedRoute>
                <AdminLiveChat />
              </ProtectedRoute>
            }
          />

          {/* Collection Pages - Dynamic routes for each brand */}
          <Route
            path="/collections/astari"
            element={<CollectionPage brand="Astari" />}
          />
          <Route
            path="/collections/lamkin"
            element={<CollectionPage brand="Lamkin" />}
          />
          <Route
            path="/collections/iguana"
            element={<CollectionPage brand="Iguana" />}
          />
          <Route
            path="/collections/gripshift"
            element={<CollectionPage brand="GripShift" />}
          />
          <Route
            path="/collections/kola"
            element={<CollectionPage brand="Kola" />}
          />
              </Routes>
              <UnifiedChatWidget />
            </Router>
          </WishlistProvider>
        </CartProvider>
      </CustomerAuthProvider>
    </AdminAuthProvider>
  )
}

export default App
