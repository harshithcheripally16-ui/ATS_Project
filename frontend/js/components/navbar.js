/**
 * Navbar Component with Simplified Roles, Quick-Access Profile Dropdown,
 * Light/Dark Theme Toggle, Role-Aware Links, and MUI Mobile Drawer
 */
function renderNavbar() {
  const navContainer = document.getElementById("navbar");
  if (!navContainer) return;

  const user = window.authApi ? window.authApi.getCurrentUser() : null;
  const currentPath = window.location.pathname;
  const currentTheme = document.documentElement.getAttribute("data-theme") || localStorage.getItem("theme") || "dark";

  const isActive = (path) => {
    if (path === "/" && (currentPath === "/" || currentPath.endsWith("index.html"))) return true;
    if (path !== "/" && currentPath.includes(path)) return true;
    return false;
  };

  const getRoleLabel = (role) => {
    if (!role) return "";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  let desktopLinks = "";
  let drawerLinks = "";

  if (!user) {
    // ---------------- Guest (Unauthenticated Visitor) Navigation ----------------
    desktopLinks = `
      <li><a href="/" class="nav-link ${isActive("/") ? "active" : ""}"><span class="material-icons icon-sm">home</span> Home</a></li>
      <li><a href="/pages/jobs.html" class="nav-link ${isActive("/jobs.html") ? "active" : ""}"><span class="material-icons icon-sm">search</span> Find Jobs</a></li>
      <li><a href="/pages/login.html" class="nav-link ${isActive("/login.html") ? "active" : ""}"><span class="material-icons icon-sm">login</span> Sign In</a></li>
      <li><a href="/pages/register.html" class="nav-link ${isActive("/register.html") ? "active" : ""}"><span class="material-icons icon-sm">person_add</span> Sign Up</a></li>
      <li>
        <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle Light/Dark Theme">
          <span class="material-icons">${currentTheme === "light" ? "dark_mode" : "light_mode"}</span>
        </button>
      </li>
    `;
    drawerLinks = `
      <li><a href="/" class="nav-link ${isActive("/") ? "active" : ""}"><span class="material-icons icon-sm">home</span> Home</a></li>
      <li><a href="/pages/jobs.html" class="nav-link ${isActive("/jobs.html") ? "active" : ""}"><span class="material-icons icon-sm">search</span> Find Jobs</a></li>
      <li><a href="/pages/login.html" class="nav-link ${isActive("/login.html") ? "active" : ""}"><span class="material-icons icon-sm">login</span> Sign In</a></li>
      <li><a href="/pages/register.html" class="nav-link ${isActive("/register.html") ? "active" : ""}"><span class="material-icons icon-sm">person_add</span> Sign Up</a></li>
      <li style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--md-sys-color-outline); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant); font-weight: 600;">Theme</span>
        <button class="theme-toggle-btn" id="drawer-theme-toggle" aria-label="Toggle theme" title="Toggle Light/Dark Theme">
          <span class="material-icons">${currentTheme === "light" ? "dark_mode" : "light_mode"}</span>
        </button>
      </li>
    `;
  } else {
    // ---------------- Role-Specific Navigation Links ----------------
    if (user.role === "candidate") {
      desktopLinks = `
        <li><a href="/pages/candidate/dashboard.html" class="nav-link ${isActive("/candidate/dashboard.html") ? "active" : ""}"><span class="material-icons icon-sm">space_dashboard</span> My Dashboard</a></li>
        <li><a href="/pages/jobs.html" class="nav-link ${isActive("/jobs.html") ? "active" : ""}"><span class="material-icons icon-sm">search</span> Find Jobs</a></li>
        <li><a href="/pages/candidate/profile.html" class="nav-link ${isActive("/candidate/profile.html") ? "active" : ""}"><span class="material-icons icon-sm">account_circle</span> Profile & Resume</a></li>
      `;
      drawerLinks = desktopLinks;
    } else if (user.role === "recruiter") {
      desktopLinks = `
        <li><a href="/pages/recruiter/dashboard.html" class="nav-link ${isActive("/recruiter/dashboard.html") ? "active" : ""}"><span class="material-icons icon-sm">dashboard</span> Recruiter Hub</a></li>
        <li><a href="/pages/recruiter/applicants.html" class="nav-link ${isActive("/recruiter/applicants.html") ? "active" : ""}"><span class="material-icons icon-sm">view_kanban</span> Applicant Pipeline</a></li>
        <li><a href="/pages/recruiter/post-job.html" class="nav-link ${isActive("/recruiter/post-job.html") ? "active" : ""}"><span class="material-icons icon-sm">add_circle_outline</span> Post Job</a></li>
      `;
      drawerLinks = `
        <li><a href="/pages/recruiter/dashboard.html" class="nav-link ${isActive("/recruiter/dashboard.html") ? "active" : ""}"><span class="material-icons icon-sm">dashboard</span> Recruiter Hub</a></li>
        <li><a href="/pages/recruiter/applicants.html" class="nav-link ${isActive("/recruiter/applicants.html") ? "active" : ""}"><span class="material-icons icon-sm">view_kanban</span> Applicant Pipeline</a></li>
        <li><a href="/pages/recruiter/post-job.html" class="nav-link ${isActive("/recruiter/post-job.html") ? "active" : ""}"><span class="material-icons icon-sm">add_circle_outline</span> Post Job</a></li>
      `;
    } else if (user.role === "admin") {
      desktopLinks = `
        <li><a href="/pages/admin/dashboard.html" class="nav-link ${isActive("/admin/dashboard.html") ? "active" : ""}"><span class="material-icons icon-sm">admin_panel_settings</span> Dashboard</a></li>
        <li><a href="/pages/admin/users.html" class="nav-link ${isActive("/admin/users.html") ? "active" : ""}"><span class="material-icons icon-sm">people</span> User Directory</a></li>
        <li><a href="/pages/admin/categories.html" class="nav-link ${isActive("/admin/categories.html") ? "active" : ""}"><span class="material-icons icon-sm">category</span> Job Categories</a></li>
        <li><a href="/pages/jobs.html" class="nav-link ${isActive("/jobs.html") ? "active" : ""}"><span class="material-icons icon-sm">work_outline</span> Audit Jobs</a></li>
      `;
      drawerLinks = desktopLinks;
    }

    const roleLabel = getRoleLabel(user.role);
    const roleIcon = user.role === "admin" ? "admin_panel_settings" : (user.role === "recruiter" ? "work" : "person");

    // Simplified Account Role Pill & Click-Triggered Dropdown Menu
    desktopLinks += `
      <li class="profile-menu-wrapper" style="margin-left: 6px;">
        <button class="role-pill-btn role-pill-${user.role}" id="profile-menu-btn" aria-haspopup="true" aria-expanded="false" title="Account Menu">
          <span class="material-icons icon-sm">${roleIcon}</span>
          <span>${roleLabel}</span>
          <span class="material-icons role-pill-arrow">expand_more</span>
        </button>
        <div class="profile-dropdown" id="profile-dropdown">
          <div class="profile-dropdown-header">
            <div class="profile-dropdown-name">${user.name || "User"}</div>
            <div class="profile-dropdown-email">${user.email || ""}</div>
            <div class="profile-dropdown-role">
              <span class="badge badge-${user.role}">${roleLabel}</span>
            </div>
          </div>
          <a href="/pages/account.html" class="dropdown-item ${isActive("/pages/account.html") ? "active" : ""}">
            <span class="material-icons icon-sm">manage_accounts</span>
            Account Details
          </a>
          <div class="dropdown-divider"></div>
          <button onclick="window.authApi.logout()" class="dropdown-item dropdown-item-danger">
            <span class="material-icons icon-sm">logout</span>
            Logout
          </button>
        </div>
      </li>
      <li>
        <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle Light/Dark Theme">
          <span class="material-icons">${currentTheme === "light" ? "dark_mode" : "light_mode"}</span>
        </button>
      </li>
    `;

    drawerLinks += `
      <li style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--md-sys-color-outline); display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-${user.role}">${roleLabel}</span>
            <span style="font-weight: 600; font-size: 0.9rem; color: var(--md-sys-color-on-surface);">${user.name}</span>
          </div>
          <button class="theme-toggle-btn" id="drawer-theme-toggle" aria-label="Toggle theme" title="Toggle Light/Dark Theme">
            <span class="material-icons">${currentTheme === "light" ? "dark_mode" : "light_mode"}</span>
          </button>
        </div>
        <a href="/pages/account.html" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: flex-start;">
          <span class="material-icons icon-sm">manage_accounts</span> Account Details
        </a>
        <button onclick="window.authApi.logout()" class="btn btn-danger btn-sm" style="width: 100%;">
          <span class="material-icons icon-sm">logout</span> Logout
        </button>
      </li>
    `;
  }

  navContainer.innerHTML = `
    <header class="navbar">
      <div class="navbar-container">
        <a href="/" class="navbar-brand">
          <span class="material-icons icon-md" style="color: var(--accent-cyan);">business_center</span>
          <span>RECRUITMENT <span class="logo-accent">ATS</span></span>
        </a>
        <ul class="navbar-nav">
          ${desktopLinks}
        </ul>
        <button class="navbar-hamburger" id="nav-toggle" aria-label="Toggle navigation drawer">
          <span class="material-icons">menu</span>
        </button>
      </div>
    </header>

    <!-- Mobile Drawer Overlay -->
    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <aside class="nav-drawer" id="nav-drawer">
      <div class="drawer-header">
        <div class="navbar-brand" style="font-size: 1.1rem;">
          <span class="material-icons icon-md" style="color: var(--accent-cyan);">business_center</span>
          <span>ATS <span class="logo-accent">NAV</span></span>
        </div>
        <button class="navbar-hamburger" id="drawer-close" aria-label="Close drawer">
          <span class="material-icons">close</span>
        </button>
      </div>
      <ul class="drawer-nav">
        ${drawerLinks}
      </ul>
    </aside>
  `;

  // Attach drawer toggle handlers
  const toggleBtn = document.getElementById("nav-toggle");
  const closeBtn = document.getElementById("drawer-close");
  const backdrop = document.getElementById("drawer-backdrop");
  const drawer = document.getElementById("nav-drawer");

  const openDrawer = () => {
    drawer.classList.add("active");
    backdrop.classList.add("active");
  };

  const closeDrawer = () => {
    drawer.classList.remove("active");
    backdrop.classList.remove("active");
  };

  if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // Attach Profile Menu Dropdown Handler (Click-only)
  const profileMenuBtn = document.getElementById("profile-menu-btn");
  const profileDropdown = document.getElementById("profile-dropdown");

  if (profileMenuBtn && profileDropdown) {
    const toggleMenu = (e) => {
      e.stopPropagation();
      const isOpen = profileDropdown.classList.contains("open");
      if (isOpen) {
        profileDropdown.classList.remove("open");
        profileMenuBtn.classList.remove("active");
        profileMenuBtn.setAttribute("aria-expanded", "false");
      } else {
        profileDropdown.classList.add("open");
        profileMenuBtn.classList.add("active");
        profileMenuBtn.setAttribute("aria-expanded", "true");
      }
    };

    const closeMenu = () => {
      profileDropdown.classList.remove("open");
      profileMenuBtn.classList.remove("active");
      profileMenuBtn.setAttribute("aria-expanded", "false");
    };

    profileMenuBtn.addEventListener("click", toggleMenu);

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target) && !profileMenuBtn.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    });
  }

  // Attach Theme Switcher Handlers
  const handleThemeToggle = () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}

    const nextIcon = next === "light" ? "dark_mode" : "light_mode";
    document.querySelectorAll(".theme-toggle-btn .material-icons").forEach((iconEl) => {
      iconEl.textContent = nextIcon;
    });
  };

  const themeToggle = document.getElementById("theme-toggle");
  const drawerThemeToggle = document.getElementById("drawer-theme-toggle");
  if (themeToggle) themeToggle.addEventListener("click", handleThemeToggle);
  if (drawerThemeToggle) drawerThemeToggle.addEventListener("click", handleThemeToggle);
}

// Trigger Page Section Mount Fade-In Transition
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  requestAnimationFrame(() => {
    document.body.classList.add("page-fade-in");
  });
});

window.renderNavbar = renderNavbar;

