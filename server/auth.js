/* JWT helpers + auth middleware. Token carries { id, name, email, role }. */
"use strict";

const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.JWT_SECRET || "serverpath-dev-secret-change-me";
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role || "user" },
    getSecret(),
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

/* Optional auth: attaches req.user when a valid Bearer token is present,
   otherwise leaves req.user undefined (course stays public). */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    try {
      req.user = verifyToken(parts[1]);
    } catch (err) {
      req.user = undefined;
    }
  }
  next();
}

/* Required auth: 401 when the token is missing/invalid. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    res.status(401).json({ error: "login required" });
    return;
  }
  try {
    req.user = verifyToken(parts[1]);
    next();
  } catch (err) {
    res.status(401).json({ error: "invalid or expired token, please login again" });
  }
}

/* Admin only: 401 when not logged in, 403 when logged in as a plain user. */
function requireAdmin(req, res, next) {
  requireAuth(req, res, function () {
    if (!req.user) return; /* requireAuth already answered */
    if (req.user.role !== "admin") {
      res.status(403).json({ error: "admin access required" });
      return;
    }
    next();
  });
}

module.exports = { signToken: signToken, verifyToken: verifyToken, optionalAuth: optionalAuth, requireAuth: requireAuth, requireAdmin: requireAdmin };
