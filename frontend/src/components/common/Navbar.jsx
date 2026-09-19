import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer and dropdown on route change
  useEffect(() => {
    setDrawerOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (r) => {
    if (!r) return '';
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  };

  const roleLabel = getRoleLabel(role);
  const roleIcon = role === 'admin' ? 'admin_panel_settings' : (role === 'recruiter' ? 'work' : 'person');

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <span className="material-icons icon-md" style={{ color: 'var(--accent-cyan)' }}>business_center</span>
            <span>RECRUITMENT <span className="logo-accent">ATS</span></span>
          </Link>

          <ul className="navbar-nav">
            {!isAuthenticated ? (
              <>
                <li>
                  <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                    <span className="material-icons icon-sm">home</span> Home
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="material-icons icon-sm">search</span> Find Jobs
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="material-icons icon-sm">login</span> Sign In
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="material-icons icon-sm">person_add</span> Sign Up
                  </NavLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="theme-toggle-btn"
                    id="theme-toggle"
                    aria-label="Toggle theme"
                    title="Toggle Light/Dark Theme"
                    onClick={toggleTheme}
                  >
                    <span className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                {role === 'candidate' && (
                  <>
                    <li>
                      <NavLink to="/candidate/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">space_dashboard</span> My Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">search</span> Find Jobs
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/candidate/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">account_circle</span> Profile & Resume
                      </NavLink>
                    </li>
                  </>
                )}

                {role === 'recruiter' && (
                  <>
                    <li>
                      <NavLink to="/recruiter/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">dashboard</span> Recruiter Hub
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/recruiter/applicants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">view_kanban</span> Applicant Pipeline
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/recruiter/post-job" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">add_circle_outline</span> Post Job
                      </NavLink>
                    </li>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <li>
                      <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">admin_panel_settings</span> Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">people</span> User Directory
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">category</span> Job Categories
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="material-icons icon-sm">work_outline</span> Audit Jobs
                      </NavLink>
                    </li>
                  </>
                )}

                {/* Profile Pill & Menu */}
                <li className="profile-menu-wrapper" style={{ marginLeft: '6px' }} ref={dropdownRef}>
                  <button
                    type="button"
                    className={`role-pill-btn role-pill-${role}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(prev => !prev);
                    }}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    title="Account Menu"
                  >
                    <span className="material-icons icon-sm">{roleIcon}</span>
                    <span>{roleLabel}</span>
                    <span className="material-icons role-pill-arrow">expand_more</span>
                  </button>

                  <div className={`profile-dropdown ${dropdownOpen ? 'show' : ''}`} id="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div className="profile-dropdown-name">{user?.name || 'User'}</div>
                      <div className="profile-dropdown-email">{user?.email || ''}</div>
                      <div className="profile-dropdown-role">
                        <span className={`badge badge-${role}`}>{roleLabel}</span>
                      </div>
                    </div>
                    <Link to="/account" className="dropdown-item">
                      <span className="material-icons icon-sm">manage_accounts</span>
                      Account Details
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button type="button" onClick={handleLogout} className="dropdown-item dropdown-item-danger" style={{ width: '100%', textAlign: 'left' }}>
                      <span className="material-icons icon-sm">logout</span>
                      Logout
                    </button>
                  </div>
                </li>

                <li>
                  <button
                    type="button"
                    className="theme-toggle-btn"
                    id="theme-toggle"
                    aria-label="Toggle theme"
                    title="Toggle Light/Dark Theme"
                    onClick={toggleTheme}
                  >
                    <span className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</span>
                  </button>
                </li>
              </>
            )}
          </ul>

          <button
            type="button"
            className="navbar-hamburger"
            id="nav-toggle"
            aria-label="Toggle navigation drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`drawer-backdrop ${drawerOpen ? 'active' : ''}`}
        id="drawer-backdrop"
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`nav-drawer ${drawerOpen ? 'active' : ''}`} id="nav-drawer">
        <div className="drawer-header">
          <div className="navbar-brand" style={{ fontSize: '1.1rem' }}>
            <span className="material-icons icon-md" style={{ color: 'var(--accent-cyan)' }}>business_center</span>
            <span>ATS <span className="logo-accent">NAV</span></span>
          </div>
          <button
            type="button"
            className="navbar-hamburger"
            id="drawer-close"
            aria-label="Close drawer"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <ul className="drawer-nav">
          {!isAuthenticated ? (
            <>
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                  <span className="material-icons icon-sm">home</span> Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <span className="material-icons icon-sm">search</span> Find Jobs
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <span className="material-icons icon-sm">login</span> Sign In
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <span className="material-icons icon-sm">person_add</span> Sign Up
                </NavLink>
              </li>
              <li style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--md-sys-color-outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>Theme</span>
                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                >
                  <span className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>
              </li>
            </>
          ) : (
            <>
              {role === 'candidate' && (
                <>
                  <li>
                    <NavLink to="/candidate/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">space_dashboard</span> My Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">search</span> Find Jobs
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/candidate/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">account_circle</span> Profile & Resume
                    </NavLink>
                  </li>
                </>
              )}

              {role === 'recruiter' && (
                <>
                  <li>
                    <NavLink to="/recruiter/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">dashboard</span> Recruiter Hub
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/recruiter/applicants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">view_kanban</span> Applicant Pipeline
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/recruiter/post-job" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">add_circle_outline</span> Post Job
                    </NavLink>
                  </li>
                </>
              )}

              {role === 'admin' && (
                <>
                  <li>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">admin_panel_settings</span> Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">people</span> User Directory
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">category</span> Job Categories
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      <span className="material-icons icon-sm">work_outline</span> Audit Jobs
                    </NavLink>
                  </li>
                </>
              )}

              <li style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--md-sys-color-outline)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${role}`}>{roleLabel}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>{user?.name}</span>
                  </div>
                  <button
                    type="button"
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                  >
                    <span className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</span>
                  </button>
                </div>
                <Link to="/account" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span className="material-icons icon-sm">manage_accounts</span> Account Details
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%' }}
                >
                  <span className="material-icons icon-sm">logout</span> Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </aside>
    </>
  );
}
