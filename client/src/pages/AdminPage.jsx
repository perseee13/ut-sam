import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { authFetch, useAuth } from "../lib/auth.jsx";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return String(value);
  }
}

export default function AdminPage() {
  const { user, token, isLoggedIn, isAdmin, checking } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadUsers = useCallback(async function () {
    setUsersLoading(true);
    setUsersError("");
    try {
      const u = await authFetch("/api/auth/users", token);
      setUsers(Array.isArray(u.users) ? u.users : []);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  const loadStats = useCallback(async function () {
    setStatsLoading(true);
    setStatsError("");
    try {
      const s = await authFetch("/api/auth/stats", token);
      setStats(s);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const load = useCallback(async function () {
    setError("");
    await Promise.all([loadUsers(), loadStats()]);
  }, [loadUsers, loadStats]);

  useEffect(function () {
    if (isLoggedIn && isAdmin && token) load();
  }, [isLoggedIn, isAdmin, token, load]);

  if (checking) {
    return (
      <>
        <AppHeader />
        <main className="container admin-page">
          <p className="app-loading">Checking session security…</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <>
        <AppHeader />
        <main className="container admin-page">
          <div className="admin-denied">
            <span className="denied-icon">🚫</span>
            <h1>Administrator Access Required</h1>
            <p>
              Hi {user.name} — your account has role <strong>user</strong>. An administrator must promote your account to access this dashboard.
            </p>
            <Link className="btn btn-primary" to="/">Back to Home</Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  async function setRole(id, role) {
    setBusyId(id);
    setNotice("");
    setError("");
    try {
      await authFetch("/api/auth/users/" + id + "/role", token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role })
      });
      setNotice((role === "admin" ? "Promoted" : "Demoted") + " user #" + id + ".");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(target) {
    if (!window.confirm("Permanently delete " + target.name + " (" + target.email + ")?")) return;
    setBusyId(target.id);
    setNotice("");
    setError("");
    try {
      await authFetch("/api/auth/users/" + target.id, token, { method: "DELETE" });
      setNotice("Deleted user account " + target.email + ".");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const filteredUsers = users.filter(function (u) {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (u.name && u.name.toLowerCase().includes(q)) ||
           (u.email && u.email.toLowerCase().includes(q)) ||
           (u.role && u.role.toLowerCase().includes(q));
  });

  return (
    <>
      <AppHeader />
      <main className="container admin-page">
        <div className="admin-header-row">
          <div>
            <p className="kicker"><span className="kicker-dot"></span>System Control</p>
            <h1>Admin Dashboard</h1>
            <p className="section-sub">Manage user roles, platform statistics, and database records.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm admin-refresh-btn" onClick={load}>
            🔄 Refresh Data
          </button>
        </div>

        {notice ? <p className="admin-notice" role="status">✓ {notice}</p> : null}
        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <span className="stat-label">Total Users</span>
              <strong className="stat-value">{stats ? stats.total : (users.length || "—")}</strong>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="stat-icon text-mint">👤</span>
            <div>
              <span className="stat-label">Regular Students</span>
              <strong className="stat-value">{stats ? stats.users : "—"}</strong>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="stat-icon text-violet">⚡</span>
            <div>
              <span className="stat-label">Administrators</span>
              <strong className="stat-value">{stats ? stats.admins : "—"}</strong>
            </div>
          </div>
          <div className="admin-stat-card">
            <span className="stat-icon text-green">📅</span>
            <div>
              <span className="stat-label">Registered Today</span>
              <strong className="stat-value">{stats ? stats.registeredToday : "0"}</strong>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="admin-table-container">
          <div className="admin-table-header">
            <div className="ath-title">
              <h2>Registered Accounts ({usersLoading ? "…" : filteredUsers.length})</h2>
              <span className="ath-subtitle">MySQL user table</span>
            </div>
            <div className="ath-search">
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={filterQuery}
                onChange={function (e) { setFilterQuery(e.target.value); }}
              />
            </div>
          </div>

          {usersLoading ? <p className="app-loading">Loading users from database…</p> : null}

          {!usersLoading && usersError ? (
            <div className="app-error">
              <h2>Could not load database records</h2>
              <p>{usersError}</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={loadUsers}>Retry</button>
            </div>
          ) : null}

          {!usersLoading && !usersError ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(function (u) {
                    const isSelf = user && u.id === user.id;
                    const busy = busyId === u.id;
                    return (
                      <tr key={u.id} className={isSelf ? "is-self" : ""}>
                        <td className="font-mono">#{u.id}</td>
                        <td className="user-name-cell">
                          <span className="user-table-avatar">{u.name ? u.name[0].toUpperCase() : "U"}</span>
                          <strong>{u.name}</strong>
                          {isSelf ? <span className="self-tag">(you)</span> : null}
                        </td>
                        <td className="font-mono text-muted">{u.email}</td>
                        <td>
                          <span className={"role-badge role-" + u.role}>
                            {u.role === "admin" ? "⚡ Admin" : "Student"}
                          </span>
                        </td>
                        <td className="admin-date">{formatDate(u.created_at)}</td>
                        <td className="admin-actions text-right">
                          {u.role === "user" ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              disabled={busy}
                              onClick={function () { setRole(u.id, "admin"); }}
                            >
                              Promote to Admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              disabled={busy || isSelf}
                              onClick={function () { setRole(u.id, "user"); }}
                            >
                              Demote
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs danger"
                            disabled={busy || isSelf}
                            onClick={function () { removeUser(u); }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && !usersLoading ? (
                <p className="empty-table-note">No users match your search query.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
