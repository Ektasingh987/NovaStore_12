'use strict';

const mongoose = require('mongoose');

// ─── Subdocument: Order Item ──────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },   // Snapshot at time of purchase
    image: { type: String, default: null },   // Snapshot at time of purchase
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// ─── Subdocument: Delivery Address ───────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
  },
  { _id: false },
);

// ─── Order Status History ─────────────────────────────────────────────────────
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false },
);

// ─── Main Schema ─────────────────────────────────────────────────────────────
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Readable order ID (e.g. ORD-20240901-0001)
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },

    address: {
      type: addressSchema,
      required: [true, 'Delivery address is required'],
    },

    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['COD', 'Razorpay', 'Stripe', 'UPI', 'Wallet'],
        message: 'Invalid payment method',
      },
    },

    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded', 'Failed'],
      default: 'Unpaid',
    },

    paymentId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
      },
      default: 'Pending',
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: orderNumber (unique, sparse) is already declared via field definition
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Compound indexes for common admin/user queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, status: 1 });

// ─── Pre-save: track status history ──────────────────────────────────────────
orderSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  if (this.isNew && this.status) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
