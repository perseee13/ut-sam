/* MySQL connection pool for ServerPath auth.
   Config comes from environment variables (server/.env):
     DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   If MySQL is unreachable, auth routes return a clear 503 message
   instead of crashing the course API. */
"use strict";

let pool = null;
let poolError = null;

function getConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "serverpath",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

function getPool() {
  if (pool) return pool;
  // eslint-disable-next-line global-require
  const mysql = require("mysql2/promise");
  pool = mysql.createPool(getConfig());
  pool.on("error", function (err) {
    poolError = err;
    console.error("[db] pool error:", err.message);
  });
  return pool;
}

async function query(sql, params) {
  try {
    const p = getPool();
    const rows = await p.query(sql, params);
    return rows[0];
  } catch (err) {
    poolError = err;
    /* Stale pool (e.g. MySQL restarted while server was running):
       drop the pool once so the next query reconnects fresh. */
    if (isDbConnectionError(err) && pool) {
      try { await pool.end(); } catch (e) { /* ignore */ }
      pool = null;
    }
    throw err;
  }
}

/* Create the users table if it does not exist yet. Called lazily on
   first auth request and from the init-db script. */
async function ensureUsersTable() {
  await query(
    "CREATE TABLE IF NOT EXISTS users (" +
    "id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY," +
    "name VARCHAR(100) NOT NULL," +
    "email VARCHAR(190) NOT NULL UNIQUE," +
    "password_hash VARCHAR(255) NOT NULL," +
    "role VARCHAR(20) NOT NULL DEFAULT 'user'," +
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
  /* Migration for existing installs: add the role column if missing. */
  try {
    const cols = await query("SHOW COLUMNS FROM users LIKE 'role'");
    if (cols.length === 0) {
      await query("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER password_hash");
    }
  } catch (err) { /* table just created above already has it */ }
}

function isDbConnectionError(err) {
  if (!err) return false;
  // mysql2 pool surfaces connection failures as AggregateError with .errors[]
  const nested = Array.isArray(err.errors) ? err.errors : [];
  const all = [err].concat(nested);
  const codes = ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR", "PROTOCOL_CONNECTION_LOST", "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"];
  return all.some(function (e) {
    if (!e) return false;
    if (codes.indexOf(e.code) !== -1) return true;
    const msg = String((e.message || "") + " " + (err.message || ""));
    return /connect|ECONNREFUSED|ECONNRESET|ENOTFOUND|access denied|unknown database|read.*reset|socket hang up/i.test(msg);
  });
}

/* Create the sensor_readings table if it does not exist yet.
   Called lazily on first sensor request and from init-db script. */
async function ensureSensorReadingsTable() {
  await query(
    "CREATE TABLE IF NOT EXISTS `sensor_readings` (" +
    "`id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY," +
    "`turbidity` DECIMAL(10,2) NOT NULL," +
    "`tof` DECIMAL(10,2) NOT NULL," +
    "`light` DECIMAL(10,2) NOT NULL," +
    "`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
  /* Index for efficient latest-reading and history queries */
  try {
    await query("CREATE INDEX `idx_sensor_readings_created_at` ON `sensor_readings` (`created_at` DESC)");
  } catch (err) {
    /* Duplicate index name — safe to ignore */
  }
}

module.exports = { getPool: getPool, query: query, ensureUsersTable: ensureUsersTable, ensureSensorReadingsTable: ensureSensorReadingsTable, isDbConnectionError: isDbConnectionError, getConfig: getConfig };
