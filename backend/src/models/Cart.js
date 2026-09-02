'use strict';

const mongoose = require('mongoose');

// ─── Subdocument: Cart Item ───────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    // Snapshot of price at time of adding (useful for detecting price changes)
    priceAtAdd: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: false },
);

// ─── Main Schema ─────────────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // One cart per user
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    // Cached totals (updated on mutation)
    itemCount: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: userId (unique) index is already declared via field definition

// ─── Pre-save: keep cached totals in sync ────────────────────────────────────
cartSchema.pre('save', function (next) {
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + (item.priceAtAdd || 0) * item.quantity, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
