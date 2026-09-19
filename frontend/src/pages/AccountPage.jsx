import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const { user, role, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleLabel = (r) => {
    if (!r) return '';
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  };

  return (
    <main className="container">
      <div style={{ marginBottom: '32px' }}>
        <div className="mono-tag" style={{ marginBottom: '8px' }}>USER SETTINGS</div>
        <h1 style={{ marginBottom: '8px' }}>Account Details</h1>
        <p className="text-muted">Manage and view your profile information, active role, and session credentials.</p>
      </div>

      <div className="grid grid-cols-3" style={{ alignItems: 'start' }}>
        {/* Profile Information Card (spans 2 cols on wide screens) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--md-sys-color-outline)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: '#07090e', boxShadow: 'var(--glow-primary)' }}>
              {getInitials(user?.name)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{user?.name || 'Portal User'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="text-muted" style={{ fontSize: '0.95rem' }}>{user?.email}</span>
                <span className={`badge badge-${role}`}>{getRoleLabel(role)}</span>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px' }}>Profile Information</h3>

          <div className="grid grid-cols-2" style={{ gap: '18px', marginBottom: '24px' }}>
            <div>
              <label className="form-label text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-radius-sm)' }}>
                {user?.name || '-'}
              </div>
            </div>
            <div>
              <label className="form-label text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-radius-sm)' }}>
                {user?.email || '-'}
              </div>
            </div>
            <div>
              <label className="form-label text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Role</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-radius-sm)', textTransform: 'capitalize' }}>
                {role || '-'}
              </div>
            </div>
            <div>
              <label className="form-label text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Status</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-radius-sm)' }}>
                <span className="badge badge-selected"><span className="material-icons icon-sm">check_circle</span> Active</span>
              </div>
            </div>
            <div>
              <label className="form-label text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Phone</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-radius-sm)' }}>
                {user?.phone || 'Not provided'}
              </div>
            </div>
            <div>
              <label className="form-label text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID</label>
              <div style={{ fontSize: '1rem', fontWeight: 600, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-radius-sm)', fontFamily: 'var(--font-mono)' }}>
                #{user?.id || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role Actions & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Quick Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {role === 'candidate' && (
                <>
                  <Link to="/candidate/dashboard" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <span className="material-icons icon-sm">space_dashboard</span> My Applications Dashboard
                  </Link>
                  <Link to="/candidate/profile" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <span className="material-icons icon-sm">account_circle</span> Edit Profile & Resume
                  </Link>
                </>
              )}
              {role === 'recruiter' && (
                <>
                  <Link to="/recruiter/dashboard" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <span className="material-icons icon-sm">dashboard</span> Recruiter Hub
                  </Link>
                  <Link to="/recruiter/applicants" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <span className="material-icons icon-sm">view_kanban</span> Candidate Pipeline
                  </Link>
                </>
              )}
              {role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <span className="material-icons icon-sm">admin_panel_settings</span> Admin Dashboard
                  </Link>
                  <Link to="/admin/users" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <span className="material-icons icon-sm">people</span> User Directory
                  </Link>
                </>
              )}
              <Link to="/jobs" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                <span className="material-icons icon-sm">search</span> Search Jobs
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Session Controls</h3>
            <p className="text-muted" style={{ fontSize: '0.84rem', marginBottom: '16px' }}>
              Signing out terminates your current authenticated JWT session token.
            </p>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ width: '100%' }}
              onClick={logout}
            >
              <span className="material-icons icon-sm">logout</span> Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
