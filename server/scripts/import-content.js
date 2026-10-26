#!/usr/bin/env node
/* Imports course content from the legacy static site files
   (assets/js/data-*.js) into a JSON file consumed by the Express API.
   Run:  npm run import   (inside /server)                              */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const LEGACY_JS = path.join(ROOT, "assets", "js");
const OUT_DIR = path.join(__dirname, "..", "data");

const DATA_FILES = [
  "data-squid.js",
  "data-essentials.js",
  "data-files.js",
  "data-users.js",
  "data-processes.js",
  "data-network.js",
  "data-security.js",
  "data-scripting.js"
];

function loadModules() {
  const fakeWindow = { COURSE_MODULES: [] };
  const registry = fs.readFileSync(path.join(LEGACY_JS, "lessons.js"), "utf8");
  new Function("window", registry)(fakeWindow);

  DATA_FILES.forEach(function (file) {
    const source = fs.readFileSync(path.join(LEGACY_JS, file), "utf8");
    if (source.indexOf("@@") !== -1) {
      throw new Error(file + " contains a leftover placeholder marker");
    }
    new Function("window", source)(fakeWindow);
  });

  return fakeWindow.COURSE_MODULES;
}

const modules = loadModules();

const lessonCount = modules.reduce(function (n, m) { return n + m.lessons.length; }, 0);
const minutes = modules.reduce(function (n, m) {
  return n + m.lessons.reduce(function (s, l) { return s + (l.min || 0); }, 0);
}, 0);

const course = {
  meta: {
    generatedAt: new Date().toISOString(),
    moduleCount: modules.length,
    lessonCount: lessonCount,
    minutes: minutes
  },
  modules: modules
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "course.json"), JSON.stringify(course, null, 2) + "\n");

console.log("Imported " + modules.length + " modules, " + lessonCount + " lessons -> " + OUT_DIR);
