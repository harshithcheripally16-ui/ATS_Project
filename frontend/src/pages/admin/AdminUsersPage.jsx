import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();

  // Create User Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('candidate');
  const [createPhone, setCreatePhone] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers(targetPage, 10, role, isActive, search);
      setUsers(res.data?.items || []);
      setPagination(res.data?.pagination || null);
      setPage(targetPage);
    } catch (err) {
      toast.error('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [role, isActive, search, toast]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const handleToggleStatus = async (user) => {
    try {
      const nextStatus = !user.is_active;
      await adminApi.updateUserStatus(user.id, nextStatus);
      toast.success(`User ${user.name} is now ${nextStatus ? 'Active' : 'Deactivated'}.`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) {
      return;
    }
    try {
      await adminApi.deleteUser(user.id);
      toast.success('User deleted successfully.');
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createUser({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        password: createPassword,
        role: createRole,
        phone: createPhone.trim() || null
      });
      toast.success('User created successfully!');
      setIsCreateOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreatePhone('');
      fetchUsers(1);
    } catch (err) {
      toast.error(err.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="container">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
        <div>
          <div className="mono-tag" style={{ marginBottom: '6px' }}>SYSTEM DIRECTORY</div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Platform User Directory</h1>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
            Manage candidate, recruiter, and administrator access credentials and accounts.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <span className="material-icons icon-sm">person_add</span> Add New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Role Filter</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="candidate">Candidates</option>
              <option value="recruiter">Recruiters</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Active Status</label>
            <select
              className="form-control"
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Name or Email</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  fetchUsers(1);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <section className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p className="text-muted">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '36px 0' }}>No users match the search filter.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ fontSize: '0.94rem' }}>{u.name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td style={{ fontSize: '0.86rem' }}>{u.phone || '-'}</td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-selected' : 'badge-rejected'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                          >
                            <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                onPageChange={(p) => fetchUsers(p)}
              />
            )}
          </>
        )}
      </section>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User Account"
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)} disabled={creating}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreateUser} disabled={creating}>
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Alex Johnson"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              required
              placeholder="alex@company.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input
              type="password"
              className="form-control"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-control"
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
              >
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+1 555-0000"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>
    </main>
  );
}
