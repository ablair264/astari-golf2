import CollectionPage from '@/pages/CollectionPage'

// Sample product data for demo
const sampleProducts = [
  {
    id: 1,
    name: 'Cord Grip',
    brand: 'Astari',
    price: '16.99',
    inStock: true,
    category: 'Grips',
    media: '/products/1.png',
    mediaType: 'image',
    description: 'Premium cord grip designed for optimal control and feel in all weather conditions.',
    materials: 'Synthetic rubber compound with cotton cord weave',
    gallery: ['/products/1.png', '/products/2.png', '/products/3.png']
  },
  {
    id: 2,
    name: 'Sonar+ Hero',
    brand: 'Lamkin',
    price: '18.99',
    inStock: true,
    category: 'Grips',
    media: '/images/lamkin.jpg',
    mediaType: 'image',
    description: 'Play with more power and precision. New swing and putter grip technology.',
    materials: 'Advanced rubber blend with tour-proven performance',
    gallery: ['/images/lamkin.jpg', '/products/2.png', '/products/3.png']
  },
  {
    id: 3,
    name: 'Performance Grip',
    brand: 'Astari',
    price: '16.99',
    inStock: true,
    category: 'Grips',
    media: '/products/3.png',
    mediaType: 'image',
    description: 'High-performance grip engineered for consistency and control.',
    materials: 'Premium synthetic rubber with micro-texture surface',
    gallery: ['/products/3.png', '/products/1.png', '/products/2.png']
  },
  {
    id: 4,
    name: 'Tour Bag',
    brand: 'Astari',
    price: '199.99',
    inStock: true,
    category: 'Bags',
    media: '/images/bags.webp',
    mediaType: 'image',
    description: 'Professional-grade tour bag with spacious storage.',
    materials: 'Durable nylon with reinforced bottom',
    gallery: ['/images/bags.webp', '/products/2.png']
  },
  {
    id: 5,
    name: 'Deep Etched Sink Fit',
    brand: 'Lamkin',
    price: '19.99',
    inStock: true,
    category: 'Grips',
    media: '/images/lamkin.jpg',
    mediaType: 'image',
    description: 'Deep etched pattern for maximum grip and control in all conditions.',
    materials: 'Tour-grade compound with precision etched texture',
    gallery: ['/images/lamkin.jpg', '/products/1.png']
  },
  {
    id: 6,
    name: 'Velvet Grip',
    brand: 'Astari',
    price: '14.99',
    inStock: true,
    category: 'Grips',
    media: '/images/grips.webp',
    mediaType: 'image',
    description: 'Soft velvet finish provides exceptional comfort.',
    materials: 'Soft rubber compound with velvet texture',
    gallery: ['/images/grips.webp', '/products/2.png']
  },
]

const CollectionDemo = () => {
  // You can change this to test different brands
  // Options: 'Astari', 'Lamkin', 'Iguana', 'GripShift', 'Kola'
  const currentBrand = 'Astari'

  return <CollectionPage brand={currentBrand} products={sampleProducts} />
}

export default CollectionDemo
