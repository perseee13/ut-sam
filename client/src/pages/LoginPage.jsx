import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useAuth } from "../lib/auth.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(type) {
    if (type === "admin") {
      setEmail("admin@serverpath.lan");
      setPassword("admin123");
    } else {
      setEmail("student@serverpath.lan");
      setPassword("student123");
    }
  }

  return (
    <>
      <AppHeader />
      <main className="container auth-page">
        <div className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-badge">
              <span className="auth-lock-icon">🔐</span>
              <span>Secure Session</span>
            </div>

            <p className="kicker">Welcome back</p>
            <h1>Sign In</h1>
            <p className="section-sub">Sign in to sync your completed labs across devices.</p>

            {error ? <p className="auth-error" role="alert">{error}</p> : null}

            <form onSubmit={onSubmit} className="auth-form">
              <label>
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={function (e) { setEmail(e.target.value); }}
                />
              </label>

              <label>
                <div className="label-row">
                  <span>Password</span>
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={function () { setShowPassword(function (v) { return !v; }); }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={function (e) { setPassword(e.target.value); }}
                />
              </label>

              <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
                {busy ? "Authenticating…" : "Sign In →"}
              </button>
            </form>

            {/* Quick Demo Credentials for Fast Testing */}
            <div className="auth-demo-box">
              <p className="demo-title">Quick Demo Logins (Click to autofill):</p>
              <div className="demo-btns">
                <button type="button" className="btn btn-ghost btn-sm" onClick={function () { fillDemo("admin"); }}>
                  Fill Admin Account
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={function () { fillDemo("student"); }}>
                  Fill Student Account
                </button>
              </div>
            </div>

            <p className="auth-switch">
              Don't have an account yet? <Link to="/register">Create one for free</Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
