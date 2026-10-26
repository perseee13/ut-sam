import { Link } from "react-router-dom";
import { useProgress } from "../lib/progress.js";

export default function SiteFooter() {
  const progress = useProgress();

  /* Calculate progress across key modules */
  const trackedKeys = [
    "squid/what-is-squid", "squid/install-configure", "squid/acls-caching",
    "squid-forward/intro", "squid-reverse/intro", "squid-transparent/intro",
    "docker-containers/intro", "file-server/intro", "mail-server/intro",
    "keepalived/intro", "mqtt/intro", "lxd/intro", "nextcloud/intro"
  ];
  const totalTracked = trackedKeys.length;
  let doneCount = 0;
  trackedKeys.forEach(function (k) {
    if (progress.has(k)) doneCount++;
  });
  // Also count any additional stored keys
  const actualDone = Math.max(doneCount, progress.size || 0);
  const pct = Math.min(100, Math.round((actualDone / totalTracked) * 100));

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true"></div>

      <div className="container footer-main-grid">
        {/* Brand & Mission */}
        <div className="footer-col-brand">
          <div className="footer-brand-header">
            <span className="brand-logo-icon">🐧</span>
            <div>
              <p className="footer-title">Linux <em>Servers</em></p>
              <span className="footer-version-tag">Production Lab v2.4</span>
            </div>
          </div>
          <p className="footer-brand-sub">
            A self-paced, open-source educational laboratory for learning Linux server architecture, network proxying, virtualization, and systems administration.
          </p>

          {/* Interactive overall progress */}
          <div className="footer-progress-box">
            <div className="fp-head">
              <span className="fp-label">Overall Lab Completion</span>
              <span className="fp-pct">{pct}%</span>
            </div>
            <div className="fp-bar">
              <span style={{ width: `${Math.max(4, pct)}%` }}></span>
            </div>
            <p className="fp-hint">
              {actualDone > 0 ? `${actualDone} lessons completed across all modules` : "No lessons completed yet — pick a module to start"}
            </p>
          </div>
        </div>

        {/* Proxies & Traffic Control */}
        <div className="footer-col">
          <p className="footer-col-title">Proxy Architectures</p>
          <nav className="footer-links" aria-label="Proxy Links">
            <Link to="/squid-proxy">🦑 Squid Proxy Hub</Link>
            <Link to="/squid-proxy/forward-proxy">➡️ Forward Proxy (:3128)</Link>
            <Link to="/squid-proxy/reverse-proxy">🔁 Reverse Proxy (:80/:443)</Link>
            <Link to="/squid-proxy/transparent-proxy">👻 Transparent Gateway</Link>
            <Link to="/squid-proxy/intercept-ssl-bump">🔒 SSL Bump & CA</Link>
          </nav>
        </div>

        {/* Storage, Virtualization & High Availability */}
        <div className="footer-col">
          <p className="footer-col-title">Services & Infra</p>
          <nav className="footer-links" aria-label="Services Links">
            <Link to="/docker-containers">📦 Docker Containers</Link>
            <Link to="/keepalived">🔄 Keepalived VRRP HA</Link>
            <Link to="/file-server">📂 Samba & NFS Storage</Link>
            <Link to="/mail-server">📧 Postfix Mail Server</Link>
            <Link to="/mqtt">📡 Mosquitto MQTT</Link>
            <Link to="/lxd">🐧 LXD System Containers</Link>
            <Link to="/nextcloud">☁️ Nextcloud Private Cloud</Link>
          </nav>
        </div>

        {/* Principles & Quick Links */}
        <div className="footer-col">
          <p className="footer-col-title">Core Principles</p>
          <nav className="footer-links" aria-label="Architecture Principles">
            <Link to="/secure-by-design">🛡️ Secure by Design</Link>
            <Link to="/high-performance">⚡ High Performance</Link>
            <Link to="/full-control">⚙️ Full Control</Link>
            <Link to="/open-source">☁️ Open Source</Link>
            <div className="footer-auth-row">
              <Link to="/login" className="footer-sub-link">Sign In</Link>
              <span>•</span>
              <Link to="/register" className="footer-sub-link">Register</Link>
              <span>•</span>
              <Link to="/admin" className="footer-sub-link">Admin</Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="footer-copy">
          ServerPath © 2026. Built with React & Vite. Self-hosted & zero tracking.
        </p>
        <button type="button" className="footer-back-to-top" onClick={scrollToTop}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
