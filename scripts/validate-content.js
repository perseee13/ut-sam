#!/usr/bin/env node
/* ServerPath content checker — validates course data and page wiring.
   Run with:  npm run check                                        */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const JS_DIR = path.join(ROOT, "assets", "js");
const PAGES = ["index.html", "squid-proxy.html"];
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

let errors = 0;
let checks = 0;

function pass(msg) { checks++; console.log("  ok    " + msg); }
function fail(msg) { checks++; errors++; console.error("  FAIL  " + msg); }
function check(cond, msg) { if (cond) pass(msg); else fail(msg); }

/* ---- load course data into a fake window (same as the browser) ---- */
const fakeWindow = { COURSE_MODULES: [] };
function loadScript(file) {
  const source = fs.readFileSync(path.join(JS_DIR, file), "utf8");
  if (source.indexOf("@@") !== -1) fail(file + " still contains a placeholder marker");
  new Function("window", source)(fakeWindow);
}

console.log("\nCourse data");
loadScript("lessons.js");
DATA_FILES.forEach(loadScript);

const modules = fakeWindow.COURSE_MODULES;
const moduleIds = new Set();
const lessonKeys = new Set();
const blockTypes = new Set(["h", "p", "ul", "code", "tip", "warn"]);
let lessonCount = 0;
let minuteCount = 0;

check(modules.length > 0, "at least one module exists");

modules.forEach(function (module) {
  const m = module.id || "(no id)";
  check(typeof module.id === "string" && module.id.length > 0, "module has an id (" + m + ")");
  check(!moduleIds.has(module.id), "module id is unique (" + m + ")");
  moduleIds.add(module.id);
  check(typeof module.title === "string" && module.title.length > 0, m + ": has a title");
  check(typeof module.icon === "string" && module.icon.length > 0, m + ": has an icon");
  check(typeof module.sum === "string" && module.sum.length > 10, m + ": has a summary");
  check(Array.isArray(module.lessons) && module.lessons.length > 0, m + ": has lessons");

  (module.lessons || []).forEach(function (lesson) {
    lessonCount++;
    minuteCount += lesson.min || 0;
    const key = m + "/" + lesson.id;

    check(typeof lesson.id === "string" && lesson.id.length > 0, key + ": has an id");
    check(!lessonKeys.has(key), key + ": lesson key is unique");
    lessonKeys.add(key);
    check(typeof lesson.title === "string" && lesson.title.length > 0, key + ": has a title");
    check(typeof lesson.min === "number" && lesson.min > 0, key + ": has a positive minute estimate");
    check(typeof lesson.sum === "string" && lesson.sum.length > 10, key + ": has a summary");
    check(Array.isArray(lesson.blocks) && lesson.blocks.length > 0, key + ": has content blocks");

    (lesson.blocks || []).forEach(function (block, i) {
      const label = key + ": block " + (i + 1);
      check(blockTypes.has(block.t), label + " has a valid type (" + block.t + ")");
      if (block.t === "ul") {
        check(Array.isArray(block.x) && block.x.length > 0, label + " list is non-empty");
      } else {
        check(typeof block.x === "string" && block.x.length > 0, label + " has content");
      }
      if (block.t === "code") {
        check(typeof block.lang === "string" && block.lang.length > 0, label + " code block has a language");
      }
    });

    check(Array.isArray(lesson.quiz) && lesson.quiz.length > 0, key + ": has a quiz");
    (lesson.quiz || []).forEach(function (item, qi) {
      const label = key + ": quiz " + (qi + 1);
      check(typeof item.q === "string" && item.q.length > 0, label + " has a question");
      check(Array.isArray(item.opts) && item.opts.length >= 2, label + " has at least two options");
      check(Number.isInteger(item.a) && item.a >= 0 && item.a < item.opts.length, label + " answer index is in range");
      check(typeof item.why === "string" && item.why.length > 0, label + " explains its answer");
    });
  });
});

/* ---- pages ---- */
console.log("\nPages");
const htmlByPage = {};
PAGES.forEach(function (page) {
  const file = path.join(ROOT, page);
  check(fs.existsSync(file), page + " exists");
  if (fs.existsSync(file)) htmlByPage[page] = fs.readFileSync(file, "utf8");
});

PAGES.forEach(function (page) {
  const html = htmlByPage[page];
  if (!html) return;
  const refs = (html.match(/(?:src|href)="([^"]+)"/g) || []).map(function (tag) {
    return tag.replace(/^[a-z]+="/, "").replace(/"$/, "");
  });
  refs.forEach(function (ref) {
    if (/^(https?:|data:|mailto:|#)/.test(ref)) return;
    const target = ref.split("#")[0];
    check(fs.existsSync(path.join(ROOT, target)), page + " -> " + target + " exists");
  });
});

["index.html"].forEach(function (page) {
  const html = htmlByPage[page] || "";
  check(html.indexOf("assets/js/lessons.js") !== -1, page + " loads lessons.js");
  DATA_FILES.forEach(function (file) {
    check(html.indexOf("assets/js/" + file) !== -1, page + " loads " + file);
  });
});
const squidPage = htmlByPage["squid-proxy.html"] || "";
check(squidPage.indexOf("assets/js/lessons.js") !== -1, "squid-proxy.html loads lessons.js");
check(squidPage.indexOf("assets/js/data-squid.js") !== -1, "squid-proxy.html loads data-squid.js");
check(squidPage.indexOf("assets/js/squid-page.js") !== -1, "squid-proxy.html loads squid-page.js");
check(squidPage.indexOf('href="index.html"') !== -1, "squid-proxy.html links back Home");
check((htmlByPage["index.html"] || "").indexOf('href="squid-proxy.html"') !== -1, "index.html nav links to squid-proxy.html");
const index = htmlByPage["index.html"] || "";
check(index.indexOf("assets/js/lessons.js") < index.indexOf("assets/js/app.js"), "index.html loads data before app.js");

/* ---- summary ---- */
console.log("\nResult");
console.log("  " + modules.length + " modules - " + lessonCount + " lessons - ~" +
  Math.round((minuteCount / 60) * 10) / 10 + " hours of reading");
console.log("  " + checks + " checks, " + errors + " failure(s)\n");
process.exit(errors ? 1 : 0);
