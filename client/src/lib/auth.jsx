/* Auth state: JWT + user in localStorage, verified against /api/auth/me. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const TOKEN_KEY = "serverpath.auth.token";
const USER_KEY = "serverpath.auth.user";

const AuthContext = createContext(null);

function readStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    return { token: token || null, user: raw ? JSON.parse(raw) : null };
  } catch (err) {
    return { token: null, user: null };
  }
}

function writeStored(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (err) { /* storage blocked: session only */ }
}

async function postAuth(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  let data = null;
  try { data = await res.json(); } catch (err) { data = null; }
  if (!res.ok) {
    throw new Error((data && data.error) ? data.error : ("Request failed (" + res.status + ")"));
  }
  return data;
}

async function authFetch(path, token, options) {
  const res = await fetch(path, Object.assign({}, options || {}, {
    headers: Object.assign({ Accept: "application/json" }, authHeaders(token), (options && options.headers) || {})
  }));
  let data = null;
  try { data = await res.json(); } catch (err) { data = null; }
  if (!res.ok) {
    throw new Error((data && data.error) ? data.error : ("Request failed (" + res.status + ")"));
  }
  return data;
}

export function AuthProvider({ children }) {
  const [stored] = useState(readStored);
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);
  const [checking, setChecking] = useState(Boolean(stored.token));

  /* On load with a saved token, confirm it is still valid. */
  useEffect(function () {
    let alive = true;
    if (!stored.token) {
      setChecking(false);
      return;
    }
    fetch("/api/auth/me", { headers: { Authorization: "Bearer " + stored.token } })
      .then(function (res) {
        if (!res.ok) throw new Error("invalid token");
        return res.json();
      })
      .then(function (data) {
        if (!alive) return;
        setUser(data.user);
        writeStored(stored.token, data.user);
      })
      .catch(function () {
        if (!alive) return;
        setToken(null);
        setUser(null);
        writeStored(null, null);
      })
      .finally(function () {
        if (alive) setChecking(false);
      });
    return function () { alive = false; };
  }, [stored.token]);

  const login = useCallback(async function (email, password) {
    const data = await postAuth("/api/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    writeStored(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async function (name, email, password) {
    const data = await postAuth("/api/auth/register", { name, email, password });
    setToken(data.token);
    setUser(data.user);
    writeStored(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(function () {
    setToken(null);
    setUser(null);
    writeStored(null, null);
  }, []);

  /* Re-fetch /me so a role change takes effect without re-login. */
  const refreshUser = useCallback(async function () {
    if (!token) return null;
    const data = await authFetch("/api/auth/me", token);
    setUser(data.user);
    writeStored(token, data.user);
    return data.user;
  }, [token]);

  const value = useMemo(function () {
    const isAdmin = Boolean(user && user.role === "admin");
    return {
      user: user,
      token: token,
      checking: checking,
      isLoggedIn: Boolean(token && user),
      isAdmin: isAdmin,
      login: login,
      register: register,
      logout: logout,
      refreshUser: refreshUser
    };
  }, [user, token, checking, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function authHeaders(token) {
  return token ? { Authorization: "Bearer " + token } : {};
}

export { authFetch };
