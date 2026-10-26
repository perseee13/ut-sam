#!/usr/bin/env node
/* Debug: replicate POST /api/auth/register step by step. */
"use strict";
require("dotenv").config();
const db = require("../db");
const bcrypt = require("bcryptjs");
const auth = require("../auth");

(async function () {
  try {
    console.log("1. ensureUsersTable...");
    await db.ensureUsersTable();
    console.log("   ok");
    const email = "dbg" + Date.now() + "@test.com";
    console.log("2. SELECT existing...");
    const existing = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    console.log("   ok, found:", existing.length);
    console.log("3. bcrypt.hash...");
    const hash = await bcrypt.hash("secret123", 10);
    console.log("   ok", hash.slice(0, 12));
    console.log("4. INSERT...");
    const result = await db.query("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", ["Dbg", email, hash]);
    console.log("   ok, insertId:", result.insertId);
    console.log("5. SELECT new user...");
    const rows = await db.query("SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1", [result.insertId]);
    console.log("   ok:", JSON.stringify(rows[0]));
    console.log("6. signToken...");
    const token = auth.signToken({ id: rows[0].id, name: rows[0].name, email: rows[0].email });
    console.log("   ok:", token.slice(0, 30) + "...");
    console.log("\nALL STEPS PASSED");
    process.exit(0);
  } catch (err) {
    console.error("\nFAILED AT:", err);
    process.exit(1);
  }
})();
