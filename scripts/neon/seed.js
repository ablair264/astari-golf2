import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.VITE_NEON_DATABASE_URL);

// Sample categories
const categories = [
  { name: 'Grips', slug: 'grips', description: 'Premium golf grips for enhanced control and comfort' },
  { name: 'Bags', slug: 'bags', description: 'Professional golf bags for every playing style' },
  { name: 'Clubs', slug: 'clubs', description: 'High-performance golf clubs engineered for excellence' },
  { name: 'Balls', slug: 'balls', description: 'Tour-quality golf balls for optimal performance' },
];

// Sample products from App.jsx
const products = [
  // Grips
  { name: 'Cord Grip', slug: 'cord-grip', description: 'Premium cord grip designed for optimal control and feel in all weather conditions.', price: 16.99, category: 'Grips', image_url: '/products/1.png', stock_quantity: 50 },
  { name: 'Cord Grip Pro', slug: 'cord-grip-pro', description: 'Enhanced version of our classic cord grip with reinforced durability.', price: 18.99, category: 'Grips', image_url: '/products/2.png', stock_quantity: 40 },
  { name: 'Performance Grip', slug: 'performance-grip', description: 'High-performance grip engineered for consistency and control.', price: 16.99, category: 'Grips', image_url: '/products/3.png', stock_quantity: 60 },
  { name: 'Velvet Grip', slug: 'velvet-grip', description: 'Soft velvet finish provides exceptional comfort and a smooth feel.', price: 14.99, category: 'Grips', image_url: '/products/1.png', stock_quantity: 45 },
  { name: 'All-Weather Grip', slug: 'all-weather-grip', description: 'Designed to perform in any conditions, rain or shine.', price: 17.99, category: 'Grips', image_url: '/products/2.png', stock_quantity: 35 },
  { name: 'Tour Velvet', slug: 'tour-velvet', description: 'Tour-proven velvet grip trusted by professionals worldwide.', price: 19.99, category: 'Grips', image_url: '/products/3.png', stock_quantity: 30 },

  // Bags
  { name: 'Tour Bag', slug: 'tour-bag', description: 'Professional-grade tour bag with spacious 14-way top divider.', price: 199.99, category: 'Bags', image_url: '/products/1.png', stock_quantity: 15 },
  { name: 'Stand Bag', slug: 'stand-bag', description: 'Lightweight stand bag perfect for walking the course.', price: 149.99, category: 'Bags', image_url: '/products/2.png', stock_quantity: 20 },
  { name: 'Cart Bag', slug: 'cart-bag', description: 'Designed specifically for cart use with a stable base.', price: 179.99, category: 'Bags', image_url: '/products/3.png', stock_quantity: 18 },
  { name: 'Carry Bag', slug: 'carry-bag', description: 'Ultra-lightweight carry bag for minimalist golfers.', price: 129.99, category: 'Bags', image_url: '/products/1.png', stock_quantity: 25 },
  { name: 'Travel Cover', slug: 'travel-cover', description: 'Protective travel cover with padded construction.', price: 89.99, category: 'Bags', image_url: '/products/2.png', stock_quantity: 12 },
  { name: 'Staff Bag', slug: 'staff-bag', description: 'Premium staff bag designed for ultimate organization and style.', price: 249.99, category: 'Bags', image_url: '/products/3.png', stock_quantity: 10 },

  // Clubs
  { name: 'Driver', slug: 'driver', description: 'High-performance driver engineered for maximum distance.', price: 299.99, category: 'Clubs', image_url: '/products/1.png', stock_quantity: 20 },
  { name: 'Iron Set', slug: 'iron-set', description: 'Precision-forged iron set (5-PW) offering exceptional feel.', price: 599.99, category: 'Clubs', image_url: '/products/2.png', stock_quantity: 15 },
  { name: 'Fairway Wood', slug: 'fairway-wood', description: 'Versatile fairway wood designed for easy launch from any lie.', price: 249.99, category: 'Clubs', image_url: '/products/3.png', stock_quantity: 18 },
  { name: 'Hybrid', slug: 'hybrid', description: 'Easy-to-hit hybrid that bridges the gap between fairway woods and long irons.', price: 179.99, category: 'Clubs', image_url: '/products/1.png', stock_quantity: 22 },
  { name: 'Putter', slug: 'putter', description: 'Tour-inspired blade putter with precision milled face.', price: 149.99, category: 'Clubs', image_url: '/products/2.png', stock_quantity: 25 },
  { name: 'Wedge Set', slug: 'wedge-set', description: 'Complete wedge set (52°, 56°, 60°) designed for maximum spin.', price: 279.99, category: 'Clubs', image_url: '/products/3.png', stock_quantity: 16 },

  // Balls
  { name: 'Pro V1', slug: 'pro-v1', description: 'Tour-level performance ball designed for complete players.', price: 44.99, category: 'Balls', image_url: '/products/1.png', stock_quantity: 100 },
  { name: 'Distance Balls', slug: 'distance-balls', description: 'High-energy core construction delivers maximum distance.', price: 34.99, category: 'Balls', image_url: '/products/2.png', stock_quantity: 150 },
  { name: 'Tour Soft', slug: 'tour-soft', description: 'Premium soft-feel ball that combines distance with control.', price: 39.99, category: 'Balls', image_url: '/products/3.png', stock_quantity: 120 },
  { name: 'Control Elite', slug: 'control-elite', description: 'Designed for players who prioritize spin and control.', price: 42.99, category: 'Balls', image_url: '/products/1.png', stock_quantity: 80 },
  { name: 'Super Range', slug: 'super-range', description: 'Value-oriented ball perfect for practice and casual rounds.', price: 29.99, category: 'Balls', image_url: '/products/2.png', stock_quantity: 200 },
  { name: 'Premium Tour', slug: 'premium-tour', description: 'Ultimate performance ball used by tour professionals worldwide.', price: 49.99, category: 'Balls', image_url: '/products/3.png', stock_quantity: 75 },
];

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Insert categories
    console.log('📁 Inserting categories...');
    for (const category of categories) {
      await sql`
        INSERT INTO categories (name, slug, description)
        VALUES (${category.name}, ${category.slug}, ${category.description})
        ON CONFLICT (slug) DO NOTHING
      `;
    }
    console.log('✅ Categories inserted');

    // Get category IDs for foreign keys
    const categoriesMap = {};
    const categoryRows = await sql`SELECT id, name FROM categories`;
    categoryRows.forEach(row => {
      categoriesMap[row.name] = row.id;
    });

    // Insert products
    console.log('🏌️ Inserting products...');
    for (const product of products) {
      const categoryId = categoriesMap[product.category];
      await sql`
        INSERT INTO products (name, slug, description, price, category_id, image_url, stock_quantity, is_active)
        VALUES (
          ${product.name},
          ${product.slug},
          ${product.description},
          ${product.price},
          ${categoryId},
          ${product.image_url},
          ${product.stock_quantity},
          true
        )
        ON CONFLICT (slug) DO NOTHING
      `;
    }
    console.log('✅ Products inserted');

    // Summary
    const productCount = await sql`SELECT COUNT(*) as count FROM products`;
    const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;

    console.log('\n🎉 Seed completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categoryCount[0].count}`);
    console.log(`   - Products: ${productCount[0].count}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed();
