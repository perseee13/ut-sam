/* Builds the Express application: JSON API + (optionally) the built React
   client.  Exported as a factory so tests can spin it up on a random port. */
"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const catalog = require("./catalog");
const authRoutes = require("./routes-auth");
const db = require("./db");
const mqtt = require("mqtt");

/* Load server/.env when present (DB_*, JWT_SECRET, PORT, HOST). */
try {
  require("dotenv").config();
} catch (err) { /* dotenv is installed; ignore load errors */ }

const CLIENT_DIST = path.resolve(__dirname, "..", "client", "dist");

function requestLogger(req, res, next) {
  const started = Date.now();
  res.on("finish", function () {
    console.log(req.method + " " + req.originalUrl + " -> " + res.statusCode + " (" + (Date.now() - started) + "ms)");
  });
  next();
}

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  /* ---------- In-memory fallback (works even without MySQL) ---------- */
  let memoryLatest = null;
  let memoryHistory = [];
  const MEMORY_MAX_HISTORY = 200;

  function saveToMemory(turbidity, tof, light) {
    const reading = {
      turbidity: Number(turbidity).toFixed(2),
      tof: Number(tof).toFixed(2),
      light: Number(light).toFixed(2),
      created_at: new Date().toISOString()
    };
    memoryLatest = reading;
    memoryHistory.unshift(reading);
    if (memoryHistory.length > MEMORY_MAX_HISTORY) {
      memoryHistory.pop();
    }
    return reading;
  }

  /* ---------- API ---------- */

  app.get("/api/health", function (req, res) {
    res.json({ status: "ok", uptime: Math.round(process.uptime()), now: new Date().toISOString() });
  });

  app.get("/api/stats", function (req, res) {
    res.json(catalog.getMeta());
  });

  app.get("/api/course", function (req, res) {
    res.json(catalog.getCourse());
  });

  app.get("/api/modules", function (req, res) {
    res.json({ modules: catalog.listModules() });
  });

  app.get("/api/modules/:moduleId", function (req, res) {
    const module = catalog.getModule(req.params.moduleId);
    if (!module) {
      res.status(404).json({ error: "module not found", moduleId: req.params.moduleId });
      return;
    }
    res.json({ module: module });
  });

  app.get("/api/modules/:moduleId/lessons/:lessonId", function (req, res) {
    const lesson = catalog.getLesson(req.params.moduleId, req.params.lessonId);
    if (!lesson) {
      res.status(404).json({
        error: "lesson not found",
        moduleId: req.params.moduleId,
        lessonId: req.params.lessonId
      });
      return;
    }
    res.json(lesson);
  });

  /* ---------- login + register (MySQL) ---------- */

  app.use("/api/auth", authRoutes);

  /* ---------- ESP32 sensor readings ---------- */

  /* POST /api/sensors — receive readings from ESP32 */
  app.post("/api/sensors", async function (req, res) {
    /* Ensure the readings table exists (MySQL). If MySQL is down we swallow
       the connection error here and fall back to in-memory storage later in
       this handler, instead of crashing the whole request with a 500. */
    try {
      await db.ensureSensorReadingsTable();
    } catch (err) {
      if (!db.isDbConnectionError(err)) throw err;
      console.warn("[api] MySQL unavailable for POST /sensors (table check):", err.message);
    }
    const { turbidity, tof, light } = req.body || {};

    /* Validate: all three fields must be finite numbers */
    const t = Number(turbidity);
    const f = Number(tof);
    const l = Number(light);

    if (
      typeof turbidity === "undefined" ||
      typeof tof === "undefined" ||
      typeof light === "undefined" ||
      !Number.isFinite(t) ||
      !Number.isFinite(f) ||
      !Number.isFinite(l)
    ) {
      return res.status(400).json({
        error: "invalid sensor payload",
        expected: { turbidity: "number", tof: "number", light: "number" },
        received: { turbidity, tof, light }
      });
    }

    /* Sanity bounds — reject obviously bad data */
    if (t < 0 || t > 10000 || f < 0 || f > 100000 || l < 0 || l > 100000) {
      return res.status(400).json({
        error: "sensor values out of plausible range",
        received: { turbidity: t, tof: f, light: l }
      });
    }

    let savedToDb = false;
    try {
      await db.ensureSensorReadingsTable();
      await db.query(
        "INSERT INTO sensor_readings (turbidity, tof, light) VALUES (?, ?, ?)",
        [t, f, l]
      );
      savedToDb = true;
      res.status(201).json({
        ok: true,
        reading: { turbidity: t, tof: f, light: l }
      });
    } catch (err) {
      if (db.isDbConnectionError(err)) {
        console.warn("[api] MySQL unavailable for POST /sensors, saving to memory:", err.message);
        saveToMemory(t, f, l);
        return res.status(201).json({
          ok: true,
          reading: { turbidity: t, tof: f, light: l },
          note: "saved to memory (MySQL unavailable)"
        });
      }
      console.error(err);
      res.status(500).json({ error: "failed to save sensor reading" });
    }
  });

  /* GET /api/sensors/latest — most recent reading */
  app.get("/api/sensors/latest", async function (req, res) {
    /* Try MySQL first */
    try {
      await db.ensureSensorReadingsTable();
      const rows = await db.query(
        "SELECT turbidity, tof, light, created_at FROM sensor_readings ORDER BY created_at DESC LIMIT 1"
      );
      if (rows.length > 0) {
        return res.json(rows[0]);
      }
    } catch (dbErr) {
      console.warn("[api] MySQL unavailable for /latest:", dbErr.message);
    }
    /* Fall back to in-memory */
    if (memoryLatest) {
      return res.json(memoryLatest);
    }
    return res.status(404).json({ error: "no sensor readings yet" });
  });

  /* GET /api/sensors/history — historical readings (default last 50) */
  app.get("/api/sensors/history", async function (req, res) {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
    /* Try MySQL first */
    try {
      await db.ensureSensorReadingsTable();
      const rows = await db.query(
        "SELECT turbidity, tof, light, created_at FROM sensor_readings ORDER BY created_at DESC LIMIT ?",
        [limit]
      );
      /* Return oldest-first for charting */
      return res.json({ readings: rows.reverse(), count: rows.length });
    } catch (dbErr) {
      console.warn("[api] MySQL unavailable for /history:", dbErr.message);
    }
    /* Fall back to in-memory */
    const mem = memoryHistory.slice(0, limit).reverse();
    return res.json({ readings: mem, count: mem.length });
  });

  /* ---------- MQTT bridge: ESP32 -> MySQL ---------- */

  /* Connect to your Mosquitto broker (same IP as your laptop running this server) */
  const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://10.219.89.89:1883";
  const MQTT_TOPIC = process.env.MQTT_TOPIC || "esp32/turbidity_tds_light_data";

  let mqttClient = null;

  function connectMqtt() {
    try {
      mqttClient = mqtt.connect(MQTT_BROKER, {
        clientId: `serverpath-bridge-${Math.random().toString(16).slice(2, 8)}`,
        connectTimeout: 5000,
      });

      mqttClient.on("connect", function () {
        console.log("[mqtt] connected to broker:", MQTT_BROKER);
        mqttClient.subscribe(MQTT_TOPIC, function (err) {
          if (err) {
            console.error("[mqtt] subscribe error:", err.message);
          } else {
            console.log("[mqtt] subscribed to topic:", MQTT_TOPIC);
          }
        });
      });

      mqttClient.on("message", async function (topic, message) {
        if (topic !== MQTT_TOPIC) return;

        try {
          const payload = JSON.parse(message.toString());
          console.log("[mqtt] received:", JSON.stringify(payload));

          /* Map ESP32 fields to database columns.
             Accepts both direct field names (HTTP POST) and ESP32 MQTT payload names. */
          const turbidity = Number(payload.turbidity_raw ?? payload.turbidity);
          const tof = Number(
            payload.tof ??
            payload.tof_ppm ??
            payload.tof_distance_mm ??
            payload.tof_distance_cm
          );
          const light = Number(payload.lux ?? payload.light);

          if (
            !Number.isFinite(turbidity) ||
            !Number.isFinite(tof) ||
            !Number.isFinite(light)
          ) {
            console.warn("[mqtt] invalid numeric payload, skipping:", payload);
            return;
          }

          let savedToDb = false;
          try {
            await db.ensureSensorReadingsTable();
            await db.query(
              "INSERT INTO sensor_readings (turbidity, tof, light) VALUES (?, ?, ?)",
              [turbidity, tof, light]
            );
            savedToDb = true;
            console.log("[mqtt] saved to MySQL:", { turbidity, tof, light });
          } catch (dbErr) {
            /* MySQL unavailable — fall back to in-memory */
            console.warn("[mqtt] MySQL unavailable, saving to memory:", dbErr.message);
          }
          if (!savedToDb) {
            saveToMemory(turbidity, tof, light);
            console.log("[mqtt] saved to memory:", { turbidity, tof, light });
          }
        } catch (err) {
          console.error("[mqtt] error processing message:", err.message);
        }
      });

      mqttClient.on("error", function (err) {
        console.error("[mqtt] client error:", err.message);
      });

      mqttClient.on("close", function () {
        console.log("[mqtt] connection closed, retrying in 5s...");
        setTimeout(connectMqtt, 5000);
      });

      mqttClient.on("offline", function () {
        console.log("[mqtt] client offline");
      });
    } catch (err) {
      console.error("[mqtt] connect failed:", err.message);
      setTimeout(connectMqtt, 5000);
    }
  }

  /* Start MQTT bridge in background (does not block HTTP server) */
  connectMqtt();

  /* unknown API route -> JSON 404 (not the HTML fallback) */
  app.use("/api", function (req, res) {
    res.status(404).json({ error: "unknown API route", path: req.originalUrl });
  });

  /* ---------- serve the built React client when it exists ---------- */

  if (fs.existsSync(CLIENT_DIST)) {
    /* dist assets (hashed filenames) can cache long; index.html must NOT cache
       or design updates look "stuck" on phones/other devices. */
    app.use(express.static(CLIENT_DIST, {
      maxAge: "1y",
      etag: true,
      setHeaders: function (res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      }
    }));
    /* SPA fallback: any non-API GET returns index.html so client routes work.
       (Express 5: use a RegExp, not "*" — "*" throws PathError.) */
    app.get(/.*/, function (req, res, next) {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(CLIENT_DIST, "index.html"));
    });
  } else {
    app.get("/", function (req, res) {
      res.status(200).json({
        message: "ServerPath API is running. The React client has not been built yet.",
        next: [
          "cd client && npm install",
          "cd client && npm run build && cd .. && npm start   (single server, production)",
          "or run the dev servers: npm run dev:client + npm run dev:server"
        ]
      });
    });
  }

  /* ---------- error handler ---------- */

  app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}

module.exports = { createApp: createApp };
