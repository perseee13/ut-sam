#!/usr/bin/env node
/* Serves the site from disk and fetches every page and asset, proving the
   static build works end to end.  Run:  node scripts/serve-test.js        */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = 4173;
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml"
};

const server = http.createServer(function (req, res) {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const file = path.join(ROOT, rel);
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

const URLS = [
  "/index.html",
  "/assets/css/style.css",
  "/assets/js/lessons.js",
  "/assets/js/data-essentials.js",
  "/assets/js/data-files.js",
  "/assets/js/data-users.js",
  "/assets/js/data-processes.js",
  "/assets/js/data-network.js",
  "/assets/js/data-security.js",
  "/assets/js/data-scripting.js",
  "/assets/js/app.js"
];

server.listen(PORT, async function () {
  let bad = 0;
  for (const url of URLS) {
    try {
      const res = await fetch("http://127.0.0.1:" + PORT + url);
      const body = await res.text();
      const good = res.status === 200 && body.length > 0;
      console.log("  " + (good ? "ok  " : "FAIL") + "  " + res.status + "  " + url);
      if (!good) bad++;
    } catch (err) {
      bad++;
      console.error("  FAIL  " + url + " -> " + err.message);
    }
  }
  console.log(bad ? "\nserve test FAILED (" + bad + " problem(s))\n" : "\nserve test passed\n");
  process.exitCode = bad ? 1 : 0;
  server.close();
});
