import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listCategories();
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.categories || []);
      setCategories(list);
    } catch (err) {
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, name.trim(), description.trim());
        toast.success('Category updated successfully.');
      } else {
        await adminApi.createCategory(name.trim(), description.trim());
        toast.success('Category created successfully.');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }
    try {
      await adminApi.deleteCategory(cat.id);
      toast.success('Category deleted successfully.');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category.');
    }
  };

  return (
    <main className="container">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
        <div>
          <div className="mono-tag" style={{ marginBottom: '6px' }}>TAXONOMY CURATION</div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Job Categories & Departments</h1>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
            Maintain standard hiring departments and functional categories for active job listings.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={openCreateModal}
        >
          <span className="material-icons icon-sm">add</span> New Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p className="text-muted">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <p className="text-muted" style={{ textAlign: 'center', padding: '36px 0' }}>No categories created yet.</p>
      ) : (
        <div className="grid grid-cols-3" style={{ gap: '18px' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--accent-cyan)' }}>{cat.name}</h3>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                    {cat.jobs_count || 0} jobs
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px' }}>
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => openEditModal(cat)}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>edit</span> Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => handleDelete(cat)}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>delete</span> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="480px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Data & Artificial Intelligence"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Brief summary of roles in this department"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </main>
  );
}
