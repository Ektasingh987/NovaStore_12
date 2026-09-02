'use strict';

/**
 * clean_dummy_data.js
 * Purges all dummy seed users, test users, and garimasingh101220@gmail.com along with their orders, carts, and tokens.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');
const RefreshToken = require('../src/models/RefreshToken');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment');
  process.exit(1);
}

async function cleanData() {
  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // Find all users to be removed:
  // 1. Seed users: alice@example.com, bob@example.com, charlie@example.com, diana@example.com
  // 2. Test customers: customer_*@example.com
  // 3. User requested: garimasingh101220@gmail.com
  const targetFilter = {
    $or: [
      { email: { $in: ['alice@example.com', 'bob@example.com', 'charlie@example.com', 'diana@example.com', 'garimasingh101220@gmail.com'] } },
      { email: /^customer_.*@example\.com$/i },
      { role: 'customer', email: { $nin: ['ektasingh93753@gmail.com'] } }, // Any customer other than Ekta Singh
    ],
  };

  const usersToDelete = await User.find(targetFilter);
  const userIds = usersToDelete.map((u) => u._id);
  const userEmails = usersToDelete.map((u) => u.email);

  console.log(`🔍 Found ${usersToDelete.length} users to delete:`, userEmails);

  // Find orders belonging to these users, OR seed orders ORD-20260901-00001..00003, or orders placed by Garima Singh / ejya test
  const orderFilter = {
    $or: [
      { userId: { $in: userIds } },
      { orderNumber: { $in: ['ORD-20260901-00001', 'ORD-20260901-00002', 'ORD-20260901-00003', 'ORD-20260902-00001'] } },
      { 'address.fullName': { $regex: /garima|alice|bob|charlie|test customer/i } },
    ],
  };

  const ordersToDelete = await Order.find(orderFilter);
  console.log(`📋 Found ${ordersToDelete.length} orders to delete:`, ordersToDelete.map((o) => `${o.orderNumber} (${o.address?.fullName})`));

  // Perform deletions
  const [deletedOrders, deletedCarts, deletedTokens, deletedUsers] = await Promise.all([
    Order.deleteMany(orderFilter),
    Cart.deleteMany({ userId: { $in: userIds } }),
    RefreshToken.deleteMany({ userId: { $in: userIds } }),
    User.deleteMany(targetFilter),
  ]);

  console.log('\n🧹 Deletion Summary:');
  console.log(`   - Orders deleted: ${deletedOrders.deletedCount}`);
  console.log(`   - Carts deleted: ${deletedCarts.deletedCount}`);
  console.log(`   - Refresh tokens deleted: ${deletedTokens.deletedCount}`);
  console.log(`   - Users deleted: ${deletedUsers.deletedCount}`);

  // Remaining verification
  const remainingUsers = await User.find({}, { name: 1, email: 1, role: 1 });
  console.log('\n👥 Remaining Users in Database:');
  remainingUsers.forEach((u) => console.log(`   - [${u.role}] ${u.name} (${u.email})`));

  const remainingOrders = await Order.find({}, { orderNumber: 1, 'address.fullName': 1, total: 1, status: 1 });
  console.log(`\n📦 Remaining Orders in Database (${remainingOrders.length}):`);
  remainingOrders.forEach((o) => console.log(`   - ${o.orderNumber}: ${o.address?.fullName} (₹${o.total}) [${o.status}]`));

  await mongoose.disconnect();
  console.log('\n✅ Database cleanup finished successfully!');
}

cleanData().catch((err) => {
  console.error('❌ Error during cleanup:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
