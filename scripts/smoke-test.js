#!/usr/bin/env node
/* Headless smoke test: runs every browser script against a tiny DOM shim and
   reports runtime errors that a syntax check would miss.
   Run with:  node scripts/smoke-test.js                                */
"use strict";

const fs = require("fs");
const path = require("path");

const JS_DIR = path.resolve(__dirname, "..", "assets", "js");

function makeEl(id) {
  return {
    id: id,
    innerHTML: "",
    textContent: "",
    value: "",
    hidden: false,
    style: {},
    dataset: {},
    classList: {
      add: function () {}, remove: function () {}, toggle: function () {},
      contains: function () { return false; }
    },
    setAttribute: function () {},
    getAttribute: function () { return null; },
    addEventListener: function () {},
    focus: function () {},
    closest: function () { return null; },
    matches: function () { return false; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    appendChild: function () {},
    removeChild: function () {}
  };
}

const elements = new Map();
const fakeDocument = {
  title: "",
  body: makeEl("body"),
  documentElement: makeEl("html"),
  getElementById: function (id) {
    if (!elements.has(id)) elements.set(id, makeEl(id));
    return elements.get(id);
  },
  querySelector: function () { return makeEl("query"); },
  querySelectorAll: function () { return []; },
  createElement: function () { return makeEl("created"); },
  addEventListener: function () {}
};

const fakeWindow = {
  COURSE_MODULES: [],
  location: { hash: "#/essentials/what-is-linux" },
  matchMedia: function () { return { matches: false }; },
  addEventListener: function () {},
  scrollTo: function () {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  confirm: function () { return false; },
  localStorage: {
    getItem: function () { return null; },
    setItem: function () {}
  }
};
fakeWindow.window = fakeWindow;
fakeWindow.document = fakeDocument;

const SCRIPTS = [
  "lessons.js",
  "data-squid.js", "data-essentials.js", "data-files.js", "data-users.js", "data-processes.js",
  "data-network.js", "data-security.js", "data-scripting.js",
  "app.js", "squid-page.js"
];

let failures = 0;
function check(cond, msg) {
  if (cond) { console.log("  ok    " + msg); } else { failures++; console.error("  FAIL  " + msg); }
}

(SCRIPTS).forEach(function (file) {
  const source = fs.readFileSync(path.join(JS_DIR, file), "utf8");
  const factory = new Function("window", "document", "navigator", "localStorage", source);
  try {
    factory(fakeWindow, fakeDocument, fakeWindow.navigator, fakeWindow.localStorage);
    console.log("  ok    " + file + " executed without errors");
  } catch (err) {
    failures++;
    console.error("  FAIL  " + file + " threw: " + err.message);
  }
});

/* rendered output sanity */
console.log("\nRendered output");
check(fakeWindow.COURSE_MODULES.length === 8, "8 course modules are registered");
check(fakeWindow.COURSE_MODULES[0].id === "squid", "Squid Proxy is the first module");

check(elements.get("stats").innerHTML.indexOf("modules") !== -1, "landing stats rendered");

console.log("\nResult");
console.log("  smoke test finished with " + failures + " failure(s)\n");
process.exit(failures ? 1 : 0);
