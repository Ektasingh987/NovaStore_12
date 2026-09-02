'use strict';

/**
 * seed.js — Development Database Seeder.
 *
 * Usage:
 *   node scripts/seed.js           # Seeds sample data (safely resets existing seed users/data)
 *   node scripts/seed.js --clear   # Clear collections and re-seed fresh
 *
 * This script MUST NOT run in production.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore
}

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refused to run seed script in production!');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env');
  process.exit(1);
}

// ─── Models ───────────────────────────────────────────────────────────────────
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const RefreshToken = require('../src/models/RefreshToken');

const ADMIN_PASSWORD = 'Admin@Password123';
const CUSTOMER_PASSWORD = 'Customer@Password123';

async function seed() {
  console.log('\n🌱 ==========================================');
  console.log('🌱 STARTING DATABASE SEED PROCESS');
  console.log('🌱 ==========================================\n');

  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB successfully.\n');

  console.log('🧹 Cleaning existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
  console.log('✅ Collections reset.\n');

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log('👤 Seeding Users...');
  const hashedAdminPass = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const hashedCustomerPass = await bcrypt.hash(CUSTOMER_PASSWORD, 12);

  const users = await User.insertMany([
    {
      name: 'Super Admin',
      email: 'admin@ecommerce.dev',
      password: hashedAdminPass,
      role: 'admin',
      phone: '+91 98765 43210',
      isActive: true,
    },
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: hashedCustomerPass,
      role: 'customer',
      phone: '+91 98111 22233',
      isActive: true,
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: hashedCustomerPass,
      role: 'customer',
      phone: '+91 98222 33344',
      isActive: true,
    },
    {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: hashedCustomerPass,
      role: 'customer',
      phone: '+91 98333 44455',
      isActive: true,
    },
    {
      name: 'Diana Inactive',
      email: 'diana@example.com',
      password: hashedCustomerPass,
      role: 'customer',
      phone: '+91 98444 55566',
      isActive: false, // Inactive user for testing deactivation
    },
  ]);

  const [adminUser, alice, bob, charlie] = users;
  console.log(`✅ Seeded ${users.length} users (1 Admin, 4 Customers)\n`);

  // ── 2. Categories ───────────────────────────────────────────────────────────
  console.log('🏷️  Seeding Categories...');
  const categories = await Category.insertMany([
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Audio, mobile accessories, smart wearables, and computer gear.',
      image: 'http://localhost:5000/uploads/categories/electronics.jpg',
      isActive: true,
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Trendy clothing, footwear, and lifestyle fashion for men and women.',
      image: 'http://localhost:5000/uploads/categories/fashion.jpg',
      isActive: true,
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Cookware, modern appliances, home decor, and storage solutions.',
      image: 'http://localhost:5000/uploads/categories/home.jpg',
      isActive: true,
    },
    {
      name: 'Books & Stationery',
      slug: 'books-stationery',
      description: 'Best-selling novels, programming classics, art supplies, and notebooks.',
      image: 'http://localhost:5000/uploads/categories/books.jpg',
      isActive: true,
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty-personal-care',
      description: 'Skincare, haircare, grooming essentials, and wellness products.',
      image: 'http://localhost:5000/uploads/categories/beauty.jpg',
      isActive: true,
    },
    {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      description: 'Gym equipment, yoga mats, running accessories, and outdoor gear.',
      image: 'http://localhost:5000/uploads/categories/sports.jpg',
      isActive: true,
    },
    {
      name: 'Toys & Gaming',
      slug: 'toys-gaming',
      description: 'Board games, video game peripherals, building blocks, and collectible toys.',
      image: 'http://localhost:5000/uploads/categories/toys.jpg',
      isActive: true,
    },
  ]);

  const [catElec, catFashion, catHome, catBooks, catBeauty, catSports, catToys] = categories;
  console.log(`✅ Seeded ${categories.length} categories\n`);

  // ── 3. Products ─────────────────────────────────────────────────────────────
  console.log('📦 Seeding Products...');
  const productsData = [
    // Electronics (5)
    {
      name: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      description: 'Industry-leading noise cancellation with two processors and 8 microphones for exceptional call quality.',
      price: 26990,
      discount: 10,
      category: catElec._id,
      stock: 35,
      isFeatured: true,
      tags: ['audio', 'wireless', 'headphones', 'sony'],
      images: [{ url: 'http://localhost:5000/uploads/products/sony-xm5.jpg', alt: 'Sony XM5', isPrimary: true }],
    },
    {
      name: 'Logitech MX Master 3S Wireless Mouse',
      slug: 'logitech-mx-master-3s-wireless-mouse',
      description: 'Quiet clicks and 8K DPI any-surface tracking with ultra-fast MagSpeed electromagnetic scrolling.',
      price: 8995,
      discount: 15,
      category: catElec._id,
      stock: 50,
      isFeatured: true,
      tags: ['accessories', 'mouse', 'logitech', 'productivity'],
      images: [{ url: 'http://localhost:5000/uploads/products/mx-master-3s.jpg', alt: 'MX Master 3S', isPrimary: true }],
    },
    {
      name: 'Apple 20W USB-C Fast Power Adapter',
      slug: 'apple-20w-usb-c-fast-power-adapter',
      description: 'Fast, efficient charging at home, in the office, or on the go for iPhone and iPad devices.',
      price: 1900,
      discount: 5,
      category: catElec._id,
      stock: 120,
      isFeatured: false,
      tags: ['charger', 'apple', 'accessories'],
      images: [{ url: 'http://localhost:5000/uploads/products/apple-20w.jpg', alt: 'Apple Charger', isPrimary: true }],
    },
    {
      name: 'Anker 737 Power Bank 24000mAh',
      slug: 'anker-737-power-bank-24000mah',
      description: 'Ultra-powerful 140W fast-charging power bank equipped with smart digital display and 3 output ports.',
      price: 11999,
      discount: 20,
      category: catElec._id,
      stock: 25,
      isFeatured: true,
      tags: ['powerbank', 'anker', 'portable'],
      images: [{ url: 'http://localhost:5000/uploads/products/anker-737.jpg', alt: 'Anker Power Bank', isPrimary: true }],
    },
    {
      name: 'Mechanical Gaming Keyboard RGB',
      slug: 'mechanical-gaming-keyboard-rgb',
      description: 'Hot-swappable mechanical switches, per-key RGB backlighting, and durable aluminium top plate.',
      price: 4499,
      discount: 25,
      category: catElec._id,
      stock: 40,
      isFeatured: false,
      tags: ['keyboard', 'gaming', 'rgb'],
      images: [{ url: 'http://localhost:5000/uploads/products/keyboard-rgb.jpg', alt: 'Gaming Keyboard', isPrimary: true }],
    },

    // Fashion (4)
    {
      name: 'Levi\'s Men\'s 511 Slim Fit Jeans',
      slug: 'levis-mens-511-slim-fit-jeans',
      description: 'Classic modern slim cut jeans with room to move, crafted from premium stretch denim.',
      price: 2999,
      discount: 20,
      category: catFashion._id,
      stock: 80,
      isFeatured: true,
      tags: ['clothing', 'denim', 'jeans', 'levis'],
      images: [{ url: 'http://localhost:5000/uploads/products/levis-511.jpg', alt: 'Levi 511 Jeans', isPrimary: true }],
    },
    {
      name: 'Organic Cotton Crewneck T-Shirt Pack (3-Pack)',
      slug: 'organic-cotton-crewneck-t-shirt-3-pack',
      description: 'Breathable, heavyweight 100% organic cotton basic tees in Black, White, and Navy.',
      price: 1299,
      discount: 0,
      category: catFashion._id,
      stock: 150,
      isFeatured: false,
      tags: ['tshirt', 'cotton', 'basics'],
      images: [{ url: 'http://localhost:5000/uploads/products/tshirt-pack.jpg', alt: 'T-shirt pack', isPrimary: true }],
    },
    {
      name: 'Nike Air Zoom Pegasus 40 Running Shoes',
      slug: 'nike-air-zoom-pegasus-40-running-shoes',
      description: 'Responsive cushioning and breathable engineered mesh for everyday runners seeking springy energy return.',
      price: 9995,
      discount: 10,
      category: catFashion._id,
      stock: 45,
      isFeatured: true,
      tags: ['shoes', 'running', 'nike', 'footwear'],
      images: [{ url: 'http://localhost:5000/uploads/products/nike-pegasus.jpg', alt: 'Nike Pegasus', isPrimary: true }],
    },
    {
      name: 'Polarized Aviator Sunglasses',
      slug: 'polarized-aviator-sunglasses',
      description: 'Timeless military aviator sunglasses with UV400 polarized scratch-resistant lenses.',
      price: 1899,
      discount: 30,
      category: catFashion._id,
      stock: 65,
      isFeatured: false,
      tags: ['accessories', 'sunglasses', 'eyewear'],
      images: [{ url: 'http://localhost:5000/uploads/products/sunglasses.jpg', alt: 'Aviator Sunglasses', isPrimary: true }],
    },

    // Home & Kitchen (4)
    {
      name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
      slug: 'instant-pot-duo-7-in-1-electric-pressure-cooker',
      description: 'Multi-use pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer.',
      price: 7499,
      discount: 15,
      category: catHome._id,
      stock: 30,
      isFeatured: true,
      tags: ['kitchen', 'appliances', 'cooker'],
      images: [{ url: 'http://localhost:5000/uploads/products/instant-pot.jpg', alt: 'Instant Pot', isPrimary: true }],
    },
    {
      name: 'Philips Air Fryer XL 4.1L',
      slug: 'philips-air-fryer-xl-4-1l',
      description: 'Rapid Air Technology for delicious, crispy food with up to 90% less fat.',
      price: 6999,
      discount: 20,
      category: catHome._id,
      stock: 22,
      isFeatured: true,
      tags: ['kitchen', 'airfryer', 'philips'],
      images: [{ url: 'http://localhost:5000/uploads/products/philips-airfryer.jpg', alt: 'Philips Air Fryer', isPrimary: true }],
    },
    {
      name: 'Cast Iron Pre-Seasoned Skillet 10-Inch',
      slug: 'cast-iron-pre-seasoned-skillet-10-inch',
      description: 'Heavy-duty cast iron pan delivering superior heat retention and even cooking for searing and baking.',
      price: 1499,
      discount: 0,
      category: catHome._id,
      stock: 55,
      isFeatured: false,
      tags: ['cookware', 'castiron', 'kitchen'],
      images: [{ url: 'http://localhost:5000/uploads/products/cast-iron.jpg', alt: 'Cast Iron Skillet', isPrimary: true }],
    },
    {
      name: 'Stainless Steel Double-Wall Vacuum Insulated Water Bottle',
      slug: 'stainless-steel-vacuum-insulated-water-bottle',
      description: 'Keeps beverages cold for 24 hours or piping hot for 12 hours. BPA-free leak-proof lid.',
      price: 899,
      discount: 10,
      category: catHome._id,
      stock: 110,
      isFeatured: false,
      tags: ['bottle', 'stainless', 'hydration'],
      images: [{ url: 'http://localhost:5000/uploads/products/water-bottle.jpg', alt: 'Water Bottle', isPrimary: true }],
    },

    // Books & Stationery (3)
    {
      name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      slug: 'clean-code-handbook-agile-software',
      description: 'Software engineering foundational book by Robert C. Martin on writing elegant, readable code.',
      price: 899,
      discount: 10,
      category: catBooks._id,
      stock: 75,
      isFeatured: true,
      tags: ['books', 'programming', 'software'],
      images: [{ url: 'http://localhost:5000/uploads/products/clean-code.jpg', alt: 'Clean Code Book', isPrimary: true }],
    },
    {
      name: 'Atomic Habits by James Clear',
      slug: 'atomic-habits-james-clear',
      description: 'An easy and proven way to build good habits and break bad ones through tiny incremental changes.',
      price: 550,
      discount: 25,
      category: catBooks._id,
      stock: 140,
      isFeatured: true,
      tags: ['books', 'selfhelp', 'productivity'],
      images: [{ url: 'http://localhost:5000/uploads/products/atomic-habits.jpg', alt: 'Atomic Habits Book', isPrimary: true }],
    },
    {
      name: 'Moleskine Classic Hardcover Notebook (Dotted)',
      slug: 'moleskine-classic-hardcover-notebook-dotted',
      description: 'Iconic thread-bound notebook with ivory acid-free paper, ribbon bookmark, and elastic closure.',
      price: 1599,
      discount: 5,
      category: catBooks._id,
      stock: 60,
      isFeatured: false,
      tags: ['stationery', 'notebook', 'moleskine'],
      images: [{ url: 'http://localhost:5000/uploads/products/moleskine.jpg', alt: 'Moleskine Notebook', isPrimary: true }],
    },

    // Beauty & Personal Care (3)
    {
      name: 'Minimalist 10% Niacinamide Face Serum',
      slug: 'minimalist-10-niacinamide-face-serum',
      description: 'Soothing face serum with Matmarine to control oil production, reduce blemishes, and strengthen skin barrier.',
      price: 599,
      discount: 5,
      category: catBeauty._id,
      stock: 90,
      isFeatured: false,
      tags: ['skincare', 'serum', 'beauty'],
      images: [{ url: 'http://localhost:5000/uploads/products/niacinamide.jpg', alt: 'Niacinamide Serum', isPrimary: true }],
    },
    {
      name: 'Oral-B Pro 3 Electric Rechargeable Toothbrush',
      slug: 'oral-b-pro-3-electric-rechargeable-toothbrush',
      description: 'Round brush head with 360-degree pressure control sensor that alerts you if you brush too hard.',
      price: 3499,
      discount: 15,
      category: catBeauty._id,
      stock: 35,
      isFeatured: true,
      tags: ['grooming', 'dental', 'toothbrush'],
      images: [{ url: 'http://localhost:5000/uploads/products/oral-b.jpg', alt: 'Electric Toothbrush', isPrimary: true }],
    },
    {
      name: 'CeraVe Hydrating Facial Cleanser 473ml',
      slug: 'cerave-hydrating-facial-cleanser-473ml',
      description: 'Formulated with hyaluronic acid and 3 essential ceramides to cleanse without stripping natural moisture.',
      price: 1250,
      discount: 10,
      category: catBeauty._id,
      stock: 45,
      isFeatured: false,
      tags: ['skincare', 'cleanser', 'cerave'],
      images: [{ url: 'http://localhost:5000/uploads/products/cerave.jpg', alt: 'CeraVe Cleanser', isPrimary: true }],
    },

    // Sports & Fitness (3)
    {
      name: 'Manduka PRO Yoga Mat 6mm',
      slug: 'manduka-pro-yoga-mat-6mm',
      description: 'Ultra-dense cushioning and unmatched support with a lifetime guarantee for serious yogis.',
      price: 5999,
      discount: 10,
      category: catSports._id,
      stock: 30,
      isFeatured: true,
      tags: ['yoga', 'fitness', 'mat'],
      images: [{ url: 'http://localhost:5000/uploads/products/yoga-mat.jpg', alt: 'Yoga Mat', isPrimary: true }],
    },
    {
      name: 'Adjustable Dumbbells Set (2.5kg - 24kg)',
      slug: 'adjustable-dumbbells-set-24kg',
      description: 'Quick-dial weight adjustment mechanism replacing 15 sets of dumbbells in a compact footprint.',
      price: 14999,
      discount: 15,
      category: catSports._id,
      stock: 15,
      isFeatured: true,
      tags: ['fitness', 'weights', 'gym', 'dumbbells'],
      images: [{ url: 'http://localhost:5000/uploads/products/dumbbells.jpg', alt: 'Adjustable Dumbbells', isPrimary: true }],
    },
    {
      name: 'Speed Jump Rope with Ball Bearings',
      slug: 'speed-jump-rope-ball-bearings',
      description: 'Tangle-free steel wire cable designed for double unders, cardio conditioning, and boxing training.',
      price: 499,
      discount: 20,
      category: catSports._id,
      stock: 120,
      isFeatured: false,
      tags: ['cardio', 'fitness', 'jumprope'],
      images: [{ url: 'http://localhost:5000/uploads/products/jump-rope.jpg', alt: 'Jump Rope', isPrimary: true }],
    },

    // Toys & Gaming (2)
    {
      name: 'LEGO Icons Botanical Bonsai Tree Model Kit',
      slug: 'lego-icons-botanical-bonsai-tree-kit',
      description: 'Building project featuring interchangeable green leaves and vibrant pink cherry blossom blooms.',
      price: 4299,
      discount: 5,
      category: catToys._id,
      stock: 40,
      isFeatured: true,
      tags: ['lego', 'toys', 'hobby', 'bonsai'],
      images: [{ url: 'http://localhost:5000/uploads/products/lego-bonsai.jpg', alt: 'LEGO Bonsai', isPrimary: true }],
    },
    {
      name: 'Catan Board Game (5th Edition)',
      slug: 'catan-board-game-5th-edition',
      description: 'Acclaimed strategy game of trading, building, and settlement across the island of Catan.',
      price: 2999,
      discount: 10,
      category: catToys._id,
      stock: 50,
      isFeatured: false,
      tags: ['boardgame', 'games', 'catan'],
      images: [{ url: 'http://localhost:5000/uploads/products/catan.jpg', alt: 'Catan Board Game', isPrimary: true }],
    },
  ];

  const products = await Product.insertMany(productsData);
  console.log(`✅ Seeded ${products.length} products across all categories\n`);

  // ── 4. Cart ─────────────────────────────────────────────────────────────────
  console.log('🛒 Seeding Sample Cart for Alice...');
  await Cart.create({
    userId: alice._id,
    items: [
      { productId: products[0]._id, quantity: 1, priceAtAdd: products[0].price },
      { productId: products[13]._id, quantity: 2, priceAtAdd: products[13].price },
    ],
  });
  console.log('✅ Cart seeded for Alice.\n');

  // ── 5. Orders ───────────────────────────────────────────────────────────────
  console.log('📋 Seeding Sample Orders...');
  const orders = await Order.insertMany([
    {
      userId: alice._id,
      orderNumber: 'ORD-20260901-00001',
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          image: products[0].images[0].url,
          price: products[0].price,
          discount: products[0].discount,
          quantity: 1,
        },
        {
          productId: products[1]._id,
          name: products[1].name,
          image: products[1].images[0].url,
          price: products[1].price,
          discount: products[1].discount,
          quantity: 1,
        },
      ],
      subtotal: 31936,
      discount: 0,
      deliveryCharge: 0,
      total: 31936,
      address: {
        fullName: 'Alice Johnson',
        phone: '+91 98111 22233',
        line1: 'Flat 402, Green Palms Heights',
        line2: 'Outer Ring Road, Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
      },
      paymentMethod: 'COD',
      paymentStatus: 'Unpaid',
      status: 'Delivered',
      notes: 'Delivered at front desk security.',
    },
    {
      userId: bob._id,
      orderNumber: 'ORD-20260901-00002',
      items: [
        {
          productId: products[5]._id,
          name: products[5].name,
          image: products[5].images[0].url,
          price: products[5].price,
          discount: products[5].discount,
          quantity: 2,
        },
        {
          productId: products[14]._id,
          name: products[14].name,
          image: products[14].images[0].url,
          price: products[14].price,
          discount: products[14].discount,
          quantity: 1,
        },
      ],
      subtotal: 5210.5,
      discount: 0,
      deliveryCharge: 0,
      total: 5210.5,
      address: {
        fullName: 'Bob Smith',
        phone: '+91 98222 33344',
        line1: 'B-12, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201309',
        country: 'India',
      },
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      paymentId: 'pay_sample_test_12345',
      status: 'Shipped',
      notes: 'Please ring bell twice.',
    },
    {
      userId: charlie._id,
      orderNumber: 'ORD-20260901-00003',
      items: [
        {
          productId: products[20]._id,
          name: products[20].name,
          image: products[20].images[0].url,
          price: products[20].price,
          discount: products[20].discount,
          quantity: 1,
        },
      ],
      subtotal: 12749.15,
      discount: 0,
      deliveryCharge: 0,
      total: 12749.15,
      address: {
        fullName: 'Charlie Davis',
        phone: '+91 98333 44455',
        line1: '74 Hill View Apartments',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India',
      },
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      paymentId: 'upi_ref_987654321',
      status: 'Pending',
    },
  ]);
  console.log(`✅ Seeded ${orders.length} sample orders.\n`);

  console.log('==========================================');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('==========================================\n');

  console.log('🔐 SEEDED TEST CREDENTIALS:');
  console.log('----------------------------------------------------');
  console.log('  Role      Email                     Password');
  console.log('----------------------------------------------------');
  console.log(`  Admin     admin@ecommerce.dev       ${ADMIN_PASSWORD}`);
  console.log(`  Customer  alice@example.com         ${CUSTOMER_PASSWORD}`);
  console.log(`  Customer  bob@example.com           ${CUSTOMER_PASSWORD}`);
  console.log(`  Customer  charlie@example.com       ${CUSTOMER_PASSWORD}`);
  console.log(`  Inactive  diana@example.com         ${CUSTOMER_PASSWORD}`);
  console.log('----------------------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ SEED FATAL ERROR:', err);
  if (mongoose.connection.readyState !== 0) {
    mongoose.connection.close().finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
