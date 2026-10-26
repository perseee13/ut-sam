import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useProgress } from "../lib/progress.js";

const MODULE_GROUPS = [
  {
    category: "Infrastructure & HA",
    items: [
      { to: "/docker-containers", icon: "📦", title: "Docker Containers", desc: "Containerized runtimes, isolation & compose" },
      { to: "/keepalived", icon: "🔄", title: "Keepalived & VRRP", desc: "High availability clustering with floating VIPs" },
      { to: "/mqtt", icon: "📡", title: "MQTT Broker", desc: "Lightweight pub/sub messaging for IoT services" },
      { to: "/lxd", icon: "🐧", title: "LXD System Containers", desc: "Kernel-level Linux OS containers & snapshots" },
    ]
  },
  {
    category: "Storage, Mail & Cloud",
    items: [
      { to: "/file-server", icon: "📂", title: "File Server (Samba/NFS)", desc: "Cross-platform SMB shares & POSIX NFS exports" },
      { to: "/mail-server", icon: "📧", title: "Mail Server (Postfix/Dovecot)", desc: "Production SMTP & IMAP mail infrastructure" },
      { to: "/nextcloud", icon: "☁️", title: "Nextcloud Cloud", desc: "Self-hosted private cloud storage & sync" },
    ]
  }
];

export default function AppHeader() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const progress = useProgress();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [squidOpen, setSquidOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const modulesRef = useRef(null);
  const squidRef = useRef(null);
  const userRef = useRef(null);

  const doneCount = progress.size || 0;

  useEffect(function () {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return function () {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function closeAll() {
    setOpen(false);
    setModulesOpen(false);
    setSquidOpen(false);
    setUserMenuOpen(false);
  }

  function onLogout() {
    logout();
    closeAll();
    navigate("/");
  }

  /* Close dropdowns when changing page */
  useEffect(function () {
    closeAll();
  }, [location.pathname]);

  /* Close dropdowns when clicking outside or pressing Escape */
  useEffect(function () {
    function onDocClick(event) {
      if (modulesRef.current && !modulesRef.current.contains(event.target)) {
        setModulesOpen(false);
      }
      if (squidRef.current && !squidRef.current.contains(event.target)) {
        setSquidOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    function onKey(event) {
      if (event.key === "Escape") {
        closeAll();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container header-inner">
        {/* Brand / Logo */}
        <NavLink className="brand" to="/" onClick={closeAll}>
          <div className="brand-badge" aria-hidden="true">
            <span className="brand-logo-icon">🐧</span>
            <span className="brand-dot-live"></span>
          </div>
          <div className="brand-text">
            <span className="brand-name">
              Linux <em>Servers</em>
            </span>
             <span className="brand-surname-badge">ANTONIANO</span>


          </div>
        </NavLink>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className={`nav-toggle ${open ? "is-open" : ""}`}
          aria-expanded={open}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={function () {
            setOpen(function (v) { return !v; });
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Desktop & Collapsible Nav */}
        <nav className={`site-nav ${open ? "is-open" : ""}`} aria-label="Main Navigation">
          <NavLink to="/" end onClick={closeAll} className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>
            <span>Home</span>
          </NavLink>

          {/* All Modules Mega-Dropdown */}
          <div
            ref={modulesRef}
            className={`nav-dropdown ${modulesOpen ? "is-open" : ""}`}
            onMouseEnter={function () { setModulesOpen(true); }}
            onMouseLeave={function () { setModulesOpen(false); }}
          >
            <button
              type="button"
              className="nav-dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={modulesOpen}
              onClick={function () { setModulesOpen(function (v) { return !v; }); }}
            >
              <span>Server Modules</span>
              <span className="nav-caret" aria-hidden="true">▾</span>
            </button>

            {modulesOpen && (
              <div className="nav-mega-menu" role="menu" aria-label="Course Modules">
                <div className="mega-menu-grid">
                  {MODULE_GROUPS.map(function (grp) {
                    return (
                      <div key={grp.category} className="mega-menu-col">
                        <p className="mega-menu-heading">{grp.category}</p>
                        <div className="mega-menu-items">
                          {grp.items.map(function (item) {
                            return (
                              <NavLink
                                key={item.to}
                                to={item.to}
                                className="mega-item"
                                role="menuitem"
                                onClick={closeAll}
                              >
                                <span className="mega-item-icon" aria-hidden="true">{item.icon}</span>
                                <div className="mega-item-content">
                                  <strong>{item.title}</strong>
                                  <span>{item.desc}</span>
                                </div>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mega-menu-foot">
                  <span>💡 Complete all modules to earn your Linux SysAdmin certification</span>
                  <Link to="/squid-proxy" onClick={closeAll} className="mega-foot-link">
                    Start with Squid Proxy →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Data Page */}
          <NavLink to="/data" end onClick={closeAll} className={({ isActive }) => isActive ? "nav-link is-active" : "nav-link"}>
            <span>Data</span>
          </NavLink>

          {/* Dedicated Squid Proxy Quick Access */}
          <div
            ref={squidRef}
            className={`nav-dropdown ${squidOpen ? "is-open" : ""}`}
            onMouseEnter={function () { setSquidOpen(true); }}
            onMouseLeave={function () { setSquidOpen(false); }}
          >
            <button
              type="button"
              className="nav-dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={squidOpen}
              onClick={function () { setSquidOpen(function (v) { return !v; }); }}
            >
              <span>🦑 Squid Proxy</span>
              <span className="nav-caret" aria-hidden="true">▾</span>
            </button>

            {squidOpen && (
              <div className="nav-dropdown-menu" role="menu" aria-label="Squid Proxy sub-topics">
                <NavLink to="/squid-proxy" end role="menuitem" onClick={closeAll} className="dropdown-highlight">
                  <span className="dd-icon">🦑</span>
                  <div>
                    <strong>Squid Overview</strong>
                    <small>Core concepts & proxy architecture</small>
                  </div>
                </NavLink>
                <div className="dropdown-divider"></div>
                <NavLink to="/squid-proxy/forward-proxy" role="menuitem" onClick={closeAll}>
                  <span className="dd-icon">➡️</span> Forward Proxy (:3128)
                </NavLink>
                <NavLink to="/squid-proxy/reverse-proxy" role="menuitem" onClick={closeAll}>
                  <span className="dd-icon">🔁</span> Reverse Proxy (:80/:443)
                </NavLink>
                <NavLink to="/squid-proxy/transparent-proxy" role="menuitem" onClick={closeAll}>
                  <span className="dd-icon">👻</span> Transparent Proxy
                </NavLink>
                <NavLink to="/squid-proxy/intercept-ssl-bump" role="menuitem" onClick={closeAll}>
                  <span className="dd-icon">🔒</span> Intercept & SSL Bump
                </NavLink>
              </div>
            )}
          </div>

          {/* Quick Terminal Playground Link */}
          <a href="#playground" className="nav-link nav-terminal-link" onClick={closeAll}>
            <span className="term-pulse-dot"></span>
            <span>Terminal</span>
          </a>

          {/* Progress chip indicator if any done */}
          {doneCount > 0 ? (
            <span className="nav-progress-indicator" title={`${doneCount} lessons completed`}>
              <span className="prog-check">✓</span> {doneCount} completed
            </span>
          ) : null}

          {/* Right Action / Auth Buttons */}
          <div className="nav-actions">
            {isAdmin ? (
              <NavLink to="/admin" className="nav-admin-btn" onClick={closeAll}>
                <span className="admin-glow-icon">⚡</span> Admin Panel
              </NavLink>
            ) : null}

            {isLoggedIn ? (
              <div
                ref={userRef}
                className={`nav-user-dropdown ${userMenuOpen ? "is-open" : ""}`}
              >
                <button
                  type="button"
                  className="nav-user-trigger"
                  aria-expanded={userMenuOpen}
                  onClick={function () { setUserMenuOpen(function (v) { return !v; }); }}
                >
                  <span className="user-avatar">{user.name ? user.name[0].toUpperCase() : "U"}</span>
                  <span className="user-name">{user.name}</span>
                  {user.role === "admin" ? <span className="user-role-tag">Admin</span> : null}
                  <span className="nav-caret" aria-hidden="true">▾</span>
                </button>

                {userMenuOpen && (
                  <div className="nav-dropdown-menu user-menu-dropdown">
                    <div className="user-menu-header">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    {isAdmin ? (
                      <NavLink to="/admin" role="menuitem" onClick={closeAll} className="user-menu-item">
                        ⚡ Admin Dashboard
                      </NavLink>
                    ) : null}
                    <button type="button" className="user-menu-item logout-item" onClick={onLogout}>
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <NavLink to="/login" className="nav-login-btn" onClick={closeAll}>
                  Sign In
                </NavLink>
                <NavLink to="/register" className="nav-cta-btn" onClick={closeAll}>
                  <span>Get Started</span>
                  <span className="nav-cta-arrow" aria-hidden="true">→</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
