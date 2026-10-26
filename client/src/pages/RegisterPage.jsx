import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useAuth } from "../lib/auth.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="container auth-page">
        <div className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-badge">
              <span className="auth-lock-icon">🚀</span>
              <span>New Account</span>
            </div>

            <p className="kicker">Get Started Free</p>
            <h1>Create Account</h1>
            <p className="section-sub">Start learning Linux server administration with saved progress.</p>

            {error ? <p className="auth-error" role="alert">{error}</p> : null}

            <form onSubmit={onSubmit} className="auth-form">
              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={function (e) { setName(e.target.value); }}
                />
              </label>

              <label>
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
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
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={function (e) { setPassword(e.target.value); }}
                />
                <small className="field-hint">Minimum 6 characters for security</small>
              </label>

              <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
                {busy ? "Creating account…" : "Create Account →"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
