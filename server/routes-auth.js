/* Auth routes backed by MySQL:
     POST /api/auth/register  { name, email, password } -> { user, token } (role: user)
     POST /api/auth/login     { email, password }       -> { user, token }
     GET  /api/auth/me        (Bearer token)            -> { user }
   Admin (role: admin):
     GET   /api/auth/users             list all users (no password hashes)
     GET   /api/auth/stats             user counts + newest signups
     PATCH /api/auth/users/:id/role    { role: "user" | "admin" }
     DELETE /api/auth/users/:id        remove a user (not yourself) */
"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");
const auth = require("./auth");

const router = express.Router();

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "user",
    created_at: row.created_at || null
  };
}

function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function dbDown(res, err) {
  console.error("[auth] db error:", err && err.message ? err.message : err);
  res.status(503).json({
    error: "database unavailable — check MySQL is running and server/.env is correct",
    detail: err && err.code ? String(err.code) : undefined
  });
}

router.post("/register", async function (req, res, next) {
  const name = String(req.body && req.body.name ? req.body.name : "").trim();
  const email = String(req.body && req.body.email ? req.body.email : "").trim().toLowerCase();
  const password = String(req.body && req.body.password ? req.body.password : "");

  if (!name) return res.status(400).json({ error: "name is required" });
  if (!isEmail(email)) return res.status(400).json({ error: "valid email is required" });
  if (password.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });

  try {
    await db.ensureUsersTable();
    const existing = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "email already registered, please login" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email, hash]);
    const rows = await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1", [result.insertId]);
    const user = publicUser(rows[0]);
    res.status(201).json({ user: user, token: auth.signToken(user) });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "email already registered, please login" });
    }
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    next(err);
  }
});

router.post("/login", async function (req, res) {
  const email = String(req.body && req.body.email ? req.body.email : "").trim().toLowerCase();
  const password = String(req.body && req.body.password ? req.body.password : "");

  if (!isEmail(email)) return res.status(400).json({ error: "valid email is required" });
  if (!password) return res.status(400).json({ error: "password is required" });

  try {
    await db.ensureUsersTable();
    const rows = await db.query("SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "invalid email or password" });
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid email or password" });
    }
    const user = publicUser(rows[0]);
    res.json({ user: user, token: auth.signToken(user) });
  } catch (err) {
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    console.error(err);
    res.status(500).json({ error: "login failed" });
  }
});

router.get("/me", auth.requireAuth, async function (req, res) {
  try {
    const rows = await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "user not found" });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    console.error(err);
    res.status(500).json({ error: "failed to load profile" });
  }
});

/* ---------- admin only ---------- */

router.get("/users", auth.requireAdmin, async function (req, res, next) {
  try {
    const rows = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC LIMIT 500");
    res.json({ users: rows.map(publicUser) });
  } catch (err) {
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    next(err);
  }
});

router.get("/stats", auth.requireAdmin, async function (req, res, next) {
  try {
    const total = await db.query("SELECT COUNT(*) AS n FROM users");
    const admins = await db.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
    const today = await db.query("SELECT COUNT(*) AS n FROM users WHERE DATE(created_at) = CURDATE()");
    const newest = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 5");
    res.json({
      total: total[0].n,
      admins: admins[0].n,
      users: total[0].n - admins[0].n,
      registeredToday: today[0].n,
      newest: newest.map(publicUser)
    });
  } catch (err) {
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    next(err);
  }
});

router.patch("/users/:id/role", auth.requireAdmin, async function (req, res, next) {
  const targetId = Number(req.params.id);
  const role = String(req.body && req.body.role ? req.body.role : "").trim();
  if (!targetId) return res.status(400).json({ error: "invalid user id" });
  if (role !== "user" && role !== "admin") {
    return res.status(400).json({ error: 'role must be "user" or "admin"' });
  }
  if (targetId === req.user.id && role !== "admin") {
    return res.status(400).json({ error: "you cannot demote yourself" });
  }
  try {
    const result = await db.query("UPDATE users SET role = ? WHERE id = ? LIMIT 1", [role, targetId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "user not found" });
    const rows = await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1", [targetId]);
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    next(err);
  }
});

router.delete("/users/:id", auth.requireAdmin, async function (req, res, next) {
  const targetId = Number(req.params.id);
  if (!targetId) return res.status(400).json({ error: "invalid user id" });
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "you cannot delete yourself" });
  }
  try {
    const result = await db.query("DELETE FROM users WHERE id = ? LIMIT 1", [targetId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "user not found" });
    res.json({ deleted: targetId });
  } catch (err) {
    if (db.isDbConnectionError(err)) return dbDown(res, err);
    next(err);
  }
});

module.exports = router;
