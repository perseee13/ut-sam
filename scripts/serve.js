#!/usr/bin/env node
/* Tiny zero-dependency static server for the site.
   Run with:  npm start   (or:  node scripts/serve.js)            */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

const server = http.createServer(function (req, res) {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  let file = path.join(ROOT, rel);

  /* never serve anything outside the project folder */
  if (!file.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("forbidden");
    return;
  }

  fs.stat(file, function (statErr, stat) {
    if (!statErr && stat.isDirectory()) file = path.join(file, "index.html");

    fs.readFile(file, function (readErr, data) {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>404</h1><p>Not found: " + rel +
          "</p><p><a href=\"/\">Back to ServerPath</a></p>");
        return;
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      res.end(data);
    });
  });
});

server.listen(PORT, HOST, function () {
  console.log("");
  console.log("  ServerPath is running:");
  console.log("    http://localhost:" + PORT);
  try {
    const os = require("os");
    const nets = os.networkInterfaces();
    Object.keys(nets).forEach(function (name) {
      (nets[name] || []).forEach(function (n) {
        if (n.family === "IPv4" && !n.internal) {
          console.log("    http://" + n.address + ":" + PORT + "  (ibang device, same WiFi -> type ito)");
        }
      });
    });
  } catch (e) { /* no LAN list */ }
  console.log("");
  console.log("  Pages:  /  (home)");
  console.log("  Stop:   Ctrl+C");
  console.log("");
});
