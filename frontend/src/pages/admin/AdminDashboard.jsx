import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data || null))
      .catch(err => toast.error('Failed to load admin stats: ' + err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <main className="container">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '32px' }}>
        <div>
          <div className="mono-tag" style={{ marginBottom: '6px' }}>SYSTEM ADMINISTRATION</div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>System Administration Dashboard</h1>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
            Monitor platform health, manage user credentials and permissions, and oversee job taxonomies.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/users" className="btn btn-primary btn-sm">
            <span className="material-icons icon-sm">people</span> User Directory
          </Link>
          <Link to="/admin/categories" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">category</span> Job Categories
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4" style={{ marginBottom: '36px' }}>
        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Users
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginTop: '4px' }}>
            {stats?.users?.total ?? (loading ? '...' : 0)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
            {stats?.users?.candidates ?? 0} Candidates &bull; {stats?.users?.recruiters ?? 0} Recruiters
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Job Postings
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {stats?.jobs?.total ?? (loading ? '...' : 0)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
            {stats?.jobs?.open ?? 0} Openings Active
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Application Volume
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
            {stats?.applications?.total ?? (loading ? '...' : 0)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
            {stats?.applications?.selected ?? 0} Hired / Selected
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interviews Scheduled
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {stats?.interviews?.total ?? (loading ? '...' : 0)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '6px' }}>
            Confirmed across platform
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-3" style={{ gap: '20px' }}>
        <div className="card card-interactive">
          <span className="material-icons" style={{ fontSize: '32px', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
            manage_accounts
          </span>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>User Directory & Roles</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px' }}>
            View all registered candidates, recruiters, and admins. Activate, deactivate, or delete user accounts.
          </p>
          <Link to="/admin/users" className="btn btn-secondary btn-sm">
            Manage Users &rarr;
          </Link>
        </div>

        <div className="card card-interactive">
          <span className="material-icons" style={{ fontSize: '32px', color: 'var(--accent-blue)', marginBottom: '12px' }}>
            category
          </span>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Job Categories & Taxonomies</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px' }}>
            Create and curate corporate departments, engineering domains, and business roles for job postings.
          </p>
          <Link to="/admin/categories" className="btn btn-secondary btn-sm">
            Manage Categories &rarr;
          </Link>
        </div>

        <div className="card card-interactive">
          <span className="material-icons" style={{ fontSize: '32px', color: '#10b981', marginBottom: '12px' }}>
            integration_instructions
          </span>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Interactive API Docs</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px' }}>
            Access the Swagger REST API documentation to inspect data models, test endpoints, and audit security tokens.
          </p>
          <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            Open Swagger Spec &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}
