-- ServerPath database — import this in phpMyAdmin (Import tab)
-- or run:  C:\xampp\mysql\bin\mysql.exe -u root < server\database.sql
-- Creates `serverpath` database + `users` table for login/register.
-- Roles: 'user' (default) and 'admin' (sees the /admin dashboard).

CREATE DATABASE IF NOT EXISTS `serverpath`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `serverpath`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration for existing installs (safe to run twice):
-- Adds the role column if your `users` table was created before roles.
-- phpMyAdmin may warn "Duplicate column name" — that just means you're updated.
ALTER TABLE `users` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user' AFTER `password_hash`;

-- ============================================================
-- Sensor readings table (ESP32: turbidity, TDS, light)
-- ============================================================
CREATE TABLE IF NOT EXISTS `sensor_readings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `turbidity` DECIMAL(10,2) NOT NULL COMMENT 'Turbidity reading (NTU)',
  `tof` DECIMAL(10,2) NOT NULL COMMENT 'TOF reading',
  `light` DECIMAL(10,2) NOT NULL COMMENT 'Light intensity (lux)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for efficient latest-reading and history queries
CREATE INDEX `idx_sensor_readings_created_at` ON `sensor_readings` (`created_at` DESC);
