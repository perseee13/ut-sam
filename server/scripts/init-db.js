#!/usr/bin/env node
/* Creates the MySQL database + users table.
   Usage:
     1. copy server/.env.example to server/.env and fill DB_* values
     2. make sure MySQL is running
     3. run:  npm --prefix server run init-db
   On XAMPP the defaults (root + empty password) usually just work. */
"use strict";

const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
try {
  // eslint-disable-next-line global-require
  require("dotenv").config({ path: envPath });
} catch (err) { /* dotenv optional */ }

const mysql = require("mysql2/promise");
const db = require("../db");

async function main() {
  const cfg = db.getConfig();
  console.log("Connecting to MySQL at " + cfg.host + ":" + cfg.port + " as " + cfg.user + "...");

  // First connect WITHOUT database so we can CREATE DATABASE.
  const admin = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password
  });
  await admin.query("CREATE DATABASE IF NOT EXISTS `" + cfg.database.replace(/`/g, "") + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  await admin.end();
  console.log("Database `" + cfg.database + "` ready.");

  await db.ensureUsersTable();
  console.log("Table `users` ready. You can now register from the app.");

  await db.ensureSensorReadingsTable();
  console.log("Table `sensor_readings` ready for ESP32 data.");
  process.exit(0);
}

main().catch(function (err) {
  console.error("init-db failed:", err.message);
  console.error("Check server/.env (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME) and that MySQL is running.");
  process.exit(1);
});
