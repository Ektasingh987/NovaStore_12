'use strict';

const mongoose = require('mongoose');

// ─── Subdocument: Product Image ───────────────────────────────────────────────
const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

// ─── Subdocument: Rating Summary ─────────────────────────────────────────────
const ratingSchema = new mongoose.Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// ─── Main Schema ─────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },

    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase, hyphens only)'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Discount percentage (0–100)
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },

    images: {
      type: [productImageSchema],
      default: [],
    },

    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },

    rating: {
      type: ratingSchema,
      default: () => ({ average: 0, count: 0 }),
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // SEO / search
    tags: {
      type: [String],
      default: [],
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: slug (unique) and category (ref) indexes are already declared via field definitions
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });

// Full-text search index on name + description
productSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 3 } });

// Compound indexes for common list queries
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// ─── Virtual: effective sale price ───────────────────────────────────────────
productSchema.virtual('salePrice').get(function () {
  if (!this.discount) return this.price;
  return +(this.price * (1 - this.discount / 100)).toFixed(2);
});

// ─── Virtual: in-stock flag ───────────────────────────────────────────────────
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
