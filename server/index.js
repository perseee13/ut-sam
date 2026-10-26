#!/usr/bin/env node
/* Entry point: starts the ServerPath API (and serves the built client when
   client/dist exists). Pang-Ubuntu Server ready:
   - nakikinig sa 0.0.0.0 kaya kahit anong network/IP makaka-access
   - pag-start, ipapakita kung anong IP ang itype ng ibang device
   Run:  npm start (prod)   Dev: npm run dev */
"use strict";

const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const app = createApp();

function getIPv4s() {
  const os = require("os");
  const out = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      if (n.family === "IPv4" && !n.internal) out.push({ iface: name, address: n.address });
    }
  }
  return out;
}

app.listen(PORT, HOST, function () {
  console.log("");
  console.log("  ================================================");
  console.log("   ServerPath running!");
  console.log("  ================================================");
  console.log("   Sa server na ito buksan: http://localhost:" + PORT);
  const ips = getIPv4s();
  if (ips.length) {
    console.log("");
    console.log("   PANG-ACCESS NG IBANG DEVICE (kahit anong network");
    console.log("   basta abot ang server, itype lang ito sa browser):");
    ips.forEach(function (info) {
      console.log("     -> http://" + info.address + ":" + PORT + "  [" + info.iface + "]");
    });
    console.log("");
    console.log("   Halimbawa sa phone/laptop browser:");
    console.log("     http://" + ips[0].address + ":" + PORT);
  } else {
    console.log("   Walang nakitang LAN IP. Sa server, run: hostname -I");
  }
  console.log("");
  console.log("    GET /api/health");
  console.log("    GET /api/stats");
  console.log("    GET /api/course");
  console.log("    GET /api/modules");
  console.log("    GET /api/modules/:moduleId");
  console.log("    GET /api/modules/:moduleId/lessons/:lessonId");
  console.log("    POST /api/auth/register   (MySQL)");
  console.log("    POST /api/auth/login      (MySQL)");
  console.log("    GET  /api/auth/me         (Bearer token)");
  console.log("");
});

