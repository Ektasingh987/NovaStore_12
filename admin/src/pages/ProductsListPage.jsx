import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct } from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Package, Eye } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { PRODUCT_SORT_OPTIONS } from '../constants';
import toast from 'react-hot-toast';

export const ProductsListPage = () => {
  const dispatch = useDispatch();
  const { items: products, meta, loading, error } = useSelector((state) => state.products);
  const { items: categories } = useSelector((state) => state.categories);

  // Filter States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page,
      limit: 10,
      sort: selectedSort,
    };
    if (search.trim()) params.search = search.trim();
    if (selectedCategory) params.category = selectedCategory;
    if (inStockOnly) params.inStock = 'true';

    dispatch(fetchProducts(params));
  }, [dispatch, page, search, selectedCategory, selectedSort, inStockOnly]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    const result = await dispatch(deleteProduct(productToDelete._id));
    setDeleting(false);
    setDeleteModalOpen(false);
    setProductToDelete(null);

    if (deleteProduct.fulfilled.match(result)) {
      toast.success('Product deleted successfully');
    } else {
      toast.error(result.payload || 'Failed to delete product');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Products Catalog
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage product inventory, pricing, and digital galleries
          </p>
        </div>
        <Link to="/products/new" className="btn btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="grid grid-cols-4 md-grid-cols-1 gap-3">
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              className="form-select"
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setPage(1);
              }}
            >
              {PRODUCT_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* In Stock Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setPage(1);
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              In-Stock Only
            </label>
          </div>
        </div>
      </div>

      {/* Table / Content */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchProducts({ page, limit: 10 }))} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your search terms or filters."
            action={
              <Link to="/products/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> Add First Product
              </Link>
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const primaryImg = product.images?.[0]?.url;
                  return (
                    <tr key={product._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {primaryImg ? (
                              <img src={primaryImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={18} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {product.name}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Slug: {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {product.category?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(product.price)}
                          </span>
                          {product.discount > 0 && (
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--emerald)' }}>
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: product.stock > 10 ? 'var(--emerald)' : product.stock > 0 ? 'var(--amber)' : 'var(--rose)',
                          }}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td>
                        {product.isFeatured ? (
                          <Badge variant="delivered">Featured</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Standard</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="btn btn-secondary btn-icon"
                            title="Edit Product"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-icon"
                            title="Delete Product"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={(newPage) => setPage(newPage)} />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? All associated product image files will be permanently removed.`}
        loading={deleting}
      />
    </div>
  );
};
