import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createProduct,
  updateProduct,
  fetchProductById,
  clearCurrentProduct,
} from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { ArrowLeft, Upload, X, Package, Check } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const ProductFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, detailLoading, submitting } = useSelector((state) => state.products);
  const { items: categories } = useSelector((state) => state.categories);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    discount: '0',
    stock: '10',
    tags: '',
    isFeatured: false,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
    if (isEditMode) {
      dispatch(fetchProductById(id));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentProduct) {
      setFormData({
        name: currentProduct.name || '',
        description: currentProduct.description || '',
        category: currentProduct.category?._id || currentProduct.category || '',
        price: currentProduct.price !== undefined ? String(currentProduct.price) : '',
        discount: currentProduct.discount !== undefined ? String(currentProduct.discount) : '0',
        stock: currentProduct.stock !== undefined ? String(currentProduct.stock) : '0',
        tags: Array.isArray(currentProduct.tags) ? currentProduct.tags.join(', ') : '',
        isFeatured: Boolean(currentProduct.isFeatured),
      });

      if (currentProduct.images && currentProduct.images.length > 0) {
        setPreviewUrls(currentProduct.images.map((img) => img.url));
      }
    }
  }, [isEditMode, currentProduct]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.category) errs.category = 'Please select a category';
    if (!formData.price || Number(formData.price) < 0) errs.price = 'Valid price is required';
    if (formData.discount && (Number(formData.discount) < 0 || Number(formData.discount) > 100)) {
      errs.discount = 'Discount must be between 0 and 100%';
    }
    if (formData.stock === '' || Number(formData.stock) < 0) {
      errs.stock = 'Stock must be at least 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }

    setSelectedFiles(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('description', formData.description.trim());
    data.append('category', formData.category);
    data.append('price', formData.price);
    data.append('discount', formData.discount || '0');
    data.append('stock', formData.stock || '0');
    data.append('isFeatured', formData.isFeatured ? 'true' : 'false');
    data.append('tags', formData.tags);

    // Append image files
    selectedFiles.forEach((file) => {
      data.append('images', file);
    });

    if (isEditMode) {
      const result = await dispatch(updateProduct({ id, formData: data }));
      if (updateProduct.fulfilled.match(result)) {
        toast.success('Product updated successfully!');
        navigate('/products');
      } else {
        toast.error(result.payload || 'Failed to update product');
      }
    } else {
      const result = await dispatch(createProduct(data));
      if (createProduct.fulfilled.match(result)) {
        toast.success('Product created successfully!');
        navigate('/products');
      } else {
        toast.error(result.payload || 'Failed to create product');
      }
    }
  };

  if (isEditMode && detailLoading) {
    return <LoadingSpinner fullScreen text="Loading product details..." />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back button & title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/products" className="btn btn-secondary btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isEditMode ? 'Update product parameters and gallery' : 'Add a new item to your online catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Product Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="name">
              Product Title *
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 md-grid-cols-1 gap-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="tags">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                className="form-input"
                placeholder="audio, wireless, bluetooth"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-3 md-grid-cols-1 gap-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="price">
                Regular Price (₹) *
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="2499.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              {errors.price && <p className="form-error">{errors.price}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="discount">
                Discount (%)
              </label>
              <input
                id="discount"
                type="number"
                min="0"
                max="100"
                className="form-input"
                placeholder="10"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
              {errors.discount && <p className="form-error">{errors.discount}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="stock">
                Inventory Stock *
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                className="form-input"
                placeholder="50"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
              {errors.stock && <p className="form-error">{errors.stock}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="description">
              Product Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              rows={4}
              placeholder="Highlight key features, technical specifications, and benefits..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Image Upload Area */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Product Images (up to 5 images)</label>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('product-images-input').click()}
            >
              <Upload size={28} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                Click to upload product image(s)
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                PNG, JPG, WebP up to 5MB each
              </p>
              <input
                id="product-images-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Preview gallery */}
            {previewUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      position: 'relative',
                    }}
                  >
                    <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Is Featured Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <input
              id="isFeatured"
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="isFeatured" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Mark as Featured Product (Highlights on storefront)
            </label>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <Link to="/products" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
