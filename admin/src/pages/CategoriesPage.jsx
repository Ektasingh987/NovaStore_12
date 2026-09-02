import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../store/slices/categoriesSlice';
import { Plus, Edit, Trash2, FolderTree, Upload, Folder } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import toast from 'react-hot-toast';

export const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { items: categories, loading, submitting, error } = useSelector((state) => state.categories);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImageFile(null);
    setPreviewUrl('');
    setFormErrors({});
    setFormModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setImageFile(null);
    setPreviewUrl(cat.image || '');
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Category name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    data.append('name', name.trim());
    if (description.trim()) data.append('description', description.trim());
    if (imageFile) data.append('image', imageFile);

    if (editingCategory) {
      const result = await dispatch(updateCategory({ id: editingCategory._id, formData: data }));
      if (updateCategory.fulfilled.match(result)) {
        toast.success('Category updated successfully');
        setFormModalOpen(false);
      } else {
        toast.error(result.payload || 'Failed to update category');
      }
    } else {
      const result = await dispatch(createCategory(data));
      if (createCategory.fulfilled.match(result)) {
        toast.success('Category created successfully');
        setFormModalOpen(false);
      } else {
        toast.error(result.payload || 'Failed to create category');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    const result = await dispatch(deleteCategory(categoryToDelete._id));
    setDeleting(false);
    setDeleteModalOpen(false);
    setCategoryToDelete(null);

    if (deleteCategory.fulfilled.match(result)) {
      toast.success('Category deleted successfully');
    } else {
      toast.error(result.payload || 'Cannot delete category in use');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Categories
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Organize products into hierarchical departments and storefront taxonomies
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchCategories())} />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories created yet"
            description="Create your first category to start organizing your catalog."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={14} /> Add First Category
              </button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
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
                          {category.image ? (
                            <img src={category.image} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Folder size={18} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {category.slug}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '300px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {category.description || '—'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={category.isActive ? 'active' : 'inactive'}>
                        {category.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          title="Edit Category"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-icon"
                          title="Delete Category"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="cat-name">
                Category Name *
              </label>
              <input
                id="cat-name"
                type="text"
                className="form-input"
                placeholder="e.g. Consumer Electronics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {formErrors.name && <p className="form-error">{formErrors.name}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="cat-desc">
                Description
              </label>
              <textarea
                id="cat-desc"
                className="form-textarea"
                rows={3}
                placeholder="Describe the department or product range..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category Banner / Icon</label>
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('cat-image-input').click()}
              >
                <Upload size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.4rem' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  Click to upload category banner
                </p>
                <input
                  id="cat-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {previewUrl && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Image selected</span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Deletion will be rejected if any active products are assigned to it.`}
        loading={deleting}
      />
    </div>
  );
};
