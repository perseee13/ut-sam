#!/usr/bin/env node
/* Page render regression test.
   Boots Vite in middleware mode and renders the real React routes through
   react-dom/server, so a broken component (undefined identifier, missing prop,
   bad hook usage) fails here instead of in the browser.
   Run with:  node scripts/render-test.js                                */
"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const CLIENT_DIR = path.resolve(__dirname, "..", "client");
const VITE_ENTRY = path.join(CLIENT_DIR, "node_modules", "vite", "dist", "node", "index.js");

/* The legacy content checks work without the React client's dependencies
   installed. Skip instead of failing so `npm run check` still runs anywhere. */
if (!fs.existsSync(VITE_ENTRY)) {
  console.log("skip  render test (client dependencies not installed — run: npm --prefix client install)");
  process.exit(0);
}

async function main() {
  const { createServer } = await import(pathToFileURL(VITE_ENTRY).href);

  const vite = await createServer({
    root: CLIENT_DIR,
    configFile: path.join(CLIENT_DIR, "vite.config.js"),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error"
  });

  globalThis.__vite = vite;

  try {
    await vite.ssrLoadModule("/tests/render-pages.jsx");
  } finally {
    await vite.close();
  }
}

main().catch(function (err) {
  console.error("Render test crashed:", err);
  process.exit(1);
});
