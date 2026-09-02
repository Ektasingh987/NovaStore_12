'use strict';

const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const RefreshToken = require('../src/models/RefreshToken');
const { signAccessToken } = require('../src/utils/jwt');
const http = require('http');
const app = require('../src/app');

// Helper to make HTTP requests against the in-memory/listening express app
const request = async (server, method, path, { headers = {}, body = null } = {}) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = { ...headers };
    if (postData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    const req = http.request(
      {
        host: 'localhost',
        port,
        method,
        path,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {
            json = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      },
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const run = async () => {
  console.log('🚀 Connecting to DB for tests...');
  await mongoose.connect(env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Start HTTP server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`📡 Test server running on port ${port}`);

  try {
    // 1. Setup Admin and Customer Users
    await User.deleteMany({ email: { $in: ['admin.test@example.com', 'customer.test@example.com'] } });
    await Category.deleteMany({ name: { $in: ['Electronics Test', 'Clothing Test'] } });
    await Product.deleteMany({ name: { $in: ['Wireless Headphones', 'Cotton T-Shirt'] } });

    const admin = await User.create({
      name: 'Admin Test',
      email: 'admin.test@example.com',
      password: 'Admin@Password123',
      role: 'admin',
      isActive: true,
    });

    const customer = await User.create({
      name: 'Customer Test',
      email: 'customer.test@example.com',
      password: 'Customer@Password123',
      role: 'customer',
      isActive: true,
    });

    const adminToken = signAccessToken(admin._id, 'admin');
    const customerToken = signAccessToken(customer._id, 'customer');

    console.log('\n--- 1. CATEGORY TESTS ---');
    // Admin creates category
    let res = await request(server, 'POST', '/api/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Electronics Test', description: 'Gadgets and electronics' },
    });
    console.log('POST /api/categories (Admin):', res.status, res.body.message);
    if (res.status !== 201) throw new Error(`Category creation failed: ${JSON.stringify(res.body)}`);
    const cat1Id = res.body.data.category._id;

    // Create second category
    res = await request(server, 'POST', '/api/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Clothing Test', description: 'Apparel and accessories' },
    });
    const cat2Id = res.body.data.category._id;

    // Duplicate category name check (should 409)
    res = await request(server, 'POST', '/api/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Electronics Test' },
    });
    console.log('POST duplicate category (Should 409):', res.status, res.body.errorCode);
    if (res.status !== 409) throw new Error('Duplicate category was not rejected with 409');

    // Public list categories
    res = await request(server, 'GET', '/api/categories');
    console.log('GET /api/categories (Public):', res.status, `found ${res.body.data.categories.length} categories`);
    if (res.status !== 200) throw new Error('Category list failed');

    // Public get category by id
    res = await request(server, 'GET', `/api/categories/${cat1Id}`);
    console.log('GET /api/categories/:id:', res.status, res.body.data.category.name);

    console.log('\n--- 2. PRODUCT TESTS ---');
    // Admin creates product 1
    res = await request(server, 'POST', '/api/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Wireless Headphones',
        description: 'Noise cancelling over-ear headphones',
        price: 1500,
        discount: 10,
        category: cat1Id,
        stock: 10,
        isFeatured: true,
        tags: ['audio', 'wireless'],
      },
    });
    console.log('POST /api/products (Product 1):', res.status, res.body.message);
    if (res.status !== 201) throw new Error(`Product 1 creation failed: ${JSON.stringify(res.body)}`);
    const prod1Id = res.body.data.product._id;

    // Admin creates product 2
    res = await request(server, 'POST', '/api/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Cotton T-Shirt',
        description: '100% organic cotton t-shirt',
        price: 499,
        category: cat2Id,
        stock: 20,
        tags: ['fashion', 'apparel'],
      },
    });
    console.log('POST /api/products (Product 2):', res.status, res.body.message);
    if (res.status !== 201) throw new Error(`Product 2 creation failed: ${JSON.stringify(res.body)}`);
    const prod2Id = res.body.data.product._id;

    // Block category deletion because product references it (Should 409)
    res = await request(server, 'DELETE', `/api/categories/${cat1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('DELETE category in use (Should 409):', res.status, res.body.errorCode);
    if (res.status !== 409) throw new Error('Category deletion with referencing products was not blocked');

    // Public list products with pagination and filters
    res = await request(server, 'GET', '/api/products?page=1&limit=10&sort=price_desc');
    console.log('GET /api/products (Paginated):', res.status, 'meta:', JSON.stringify(res.body.meta));
    if (!res.body.meta || res.body.meta.totalItems < 2 || !res.body.meta.totalPages) {
      throw new Error('Pagination metadata missing or incorrect');
    }

    // Search query
    res = await request(server, 'GET', '/api/products?search=Headphones');
    console.log('GET /api/products?search=Headphones:', res.status, `found ${res.body.data.products.length} products`);

    // Price filter
    res = await request(server, 'GET', '/api/products?minPrice=1000&maxPrice=2000');
    console.log('GET /api/products?minPrice=1000&maxPrice=2000:', res.status, `found ${res.body.data.products.length} products`);

    // Single product details
    res = await request(server, 'GET', `/api/products/${prod1Id}`);
    console.log('GET /api/products/:id:', res.status, res.body.data.product.name);

    // Admin patch product
    res = await request(server, 'PATCH', `/api/products/${prod1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { stock: 12, price: 1450 },
    });
    console.log('PATCH /api/products/:id:', res.status, 'new price:', res.body.data.product.price);

    console.log('\n--- 3. CART TESTS ---');
    // Customer gets cart (initially empty)
    res = await request(server, 'GET', '/api/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log('GET /api/cart:', res.status, 'itemCount:', res.body.data.cart.itemCount);

    // Add item to cart
    res = await request(server, 'POST', '/api/cart/items', {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { productId: prod1Id, quantity: 2 },
    });
    console.log('POST /api/cart/items (Prod 1 x2):', res.status, 'subtotal:', res.body.data.cart.subtotal);
    if (res.status !== 200) throw new Error(`Add to cart failed: ${JSON.stringify(res.body)}`);

    // Add second item
    res = await request(server, 'POST', '/api/cart/items', {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { productId: prod2Id, quantity: 3 },
    });
    console.log('POST /api/cart/items (Prod 2 x3):', res.status, 'itemCount:', res.body.data.cart.itemCount);

    // Update item quantity
    res = await request(server, 'PATCH', `/api/cart/items/${prod1Id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { quantity: 1 },
    });
    console.log('PATCH /api/cart/items/:id (Qty -> 1):', res.status, 'itemCount:', res.body.data.cart.itemCount);

    // Attempt to exceed stock
    res = await request(server, 'POST', '/api/cart/items', {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { productId: prod1Id, quantity: 999 },
    });
    console.log('POST /api/cart/items exceeding stock (Should 409):', res.status, res.body.errorCode);
    if (res.status !== 409) throw new Error('Stock overflow was not rejected');

    console.log('\n--- 4. ORDER & CHECKOUT TESTS ---');
    // Checkout & place order
    res = await request(server, 'POST', '/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        address: {
          fullName: 'Customer Test',
          phone: '9876543210',
          line1: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        paymentMethod: 'COD',
        notes: 'Please call before delivery',
      },
    });
    console.log('POST /api/orders (Place order):', res.status, 'Order Number:', res.body.data.order.orderNumber, 'Total:', res.body.data.order.total);
    if (res.status !== 201) throw new Error(`Order placement failed: ${JSON.stringify(res.body)}`);
    const orderId = res.body.data.order._id;

    // Verify cart was cleared after checkout
    res = await request(server, 'GET', '/api/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log('GET /api/cart after order (should be 0):', res.body.data.cart.itemCount);
    if (res.body.data.cart.itemCount !== 0) throw new Error('Cart was not cleared after order creation');

    // Customer gets own orders
    res = await request(server, 'GET', '/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log('GET /api/orders (Customer):', res.status, `found ${res.body.data.orders.length} order(s)`);

    // Customer gets single order
    res = await request(server, 'GET', `/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log('GET /api/orders/:id:', res.status, 'status:', res.body.data.order.status);

    // Admin lists all orders
    res = await request(server, 'GET', '/api/admin/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('GET /api/admin/orders:', res.status, 'meta:', JSON.stringify(res.body.meta));

    // Admin updates status to Confirmed
    res = await request(server, 'PATCH', `/api/admin/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Confirmed', note: 'Payment verified / COD accepted' },
    });
    console.log('PATCH /api/admin/orders/:id/status (Confirmed):', res.status, res.body.message);

    // Admin updates status to Cancelled (should restore stock)
    res = await request(server, 'PATCH', `/api/admin/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Cancelled', note: 'Customer requested cancellation' },
    });
    console.log('PATCH /api/admin/orders/:id/status (Cancelled):', res.status, res.body.message);

    // Check Product 1 stock restored
    const prod1After = await Product.findById(prod1Id);
    console.log(`Product 1 stock restored: ${prod1After.stock} (expected 12)`);
    if (prod1After.stock !== 12) throw new Error(`Stock was not properly restored, current: ${prod1After.stock}`);

    console.log('\n--- 5. CLEANUP AND FINAL CHECKS ---');
    // Admin deletes products
    await request(server, 'DELETE', `/api/products/${prod1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await request(server, 'DELETE', `/api/products/${prod2Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Now category deletion succeeds
    res = await request(server, 'DELETE', `/api/categories/${cat1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('DELETE category after product removal:', res.status);
    if (res.status !== 204) throw new Error('Category deletion failed after product cleanup');

    console.log('\n🎉 ALL APIS TESTED SUCCESSFULLY AND VERIFIED!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
