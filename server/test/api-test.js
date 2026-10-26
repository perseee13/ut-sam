#!/usr/bin/env node
/* Zero-dependency API test: boots the app on a random port and exercises
   every route.  Run:  npm test   (inside /server)                        */
"use strict";

const { createApp } = require("../app");

const app = createApp();
const server = app.listen(0, run);

let failures = 0;

function check(cond, msg) {
  if (cond) {
    console.log("  ok    " + msg);
  } else {
    failures++;
    console.error("  FAIL  " + msg);
  }
}

async function get(base, pathname) {
  const res = await fetch(base + pathname);
  let body = null;
  try { body = await res.json(); } catch (err) { /* non-JSON */ }
  return { status: res.status, body: body };
}

async function run() {
  const base = "http://127.0.0.1:" + server.address().port;

  const health = await get(base, "/api/health");
  check(health.status === 200 && health.body.status === "ok", "GET /api/health -> ok");

  const stats = await get(base, "/api/stats");
  check(stats.status === 200 && stats.body.moduleCount === 8, "GET /api/stats -> 8 modules");
  check(stats.body.lessonCount === 26, "GET /api/stats -> 26 lessons");

  const course = await get(base, "/api/course");
  check(course.status === 200 && course.body.modules.length === 8, "GET /api/course -> all modules");
  check(course.body.modules[0].id === "squid", "GET /api/course -> Squid Proxy is first");
  check(course.body.modules[0].lessons.length >= 1, "GET /api/course -> modules carry lessons");

  const modules = await get(base, "/api/modules");
  check(modules.status === 200 && modules.body.modules.length === 8, "GET /api/modules -> list");
  check(modules.body.modules[0].lessonCount >= 1 && modules.body.modules[0].minutes > 0,
    "GET /api/modules -> lesson counts and minutes computed");

  const one = await get(base, "/api/modules/essentials");
  check(one.status === 200 && one.body.module.id === "essentials", "GET /api/modules/essentials -> module");
  check(one.body.module.lessons.length === 3, "essentials module has 3 lessons");

  const missing = await get(base, "/api/modules/does-not-exist");
  check(missing.status === 404, "GET /api/modules/does-not-exist -> 404");

  const first = await get(base, "/api/modules/squid/lessons/what-is-squid");
  check(first.status === 200 && first.body.lesson.id === "what-is-squid", "Squid first lesson lookup works");
  check(first.body.prev === null, "Squid first lesson has no previous");
  check(first.body.next === "squid/install-configure", "Squid first lesson next -> install-configure");
  check(first.body.position.index === 1 && first.body.position.total === 26, "position index/total computed");
  check(Array.isArray(first.body.lesson.blocks) && first.body.lesson.blocks.length > 0, "lesson carries blocks");
  check(Array.isArray(first.body.lesson.quiz) && first.body.lesson.quiz.length > 0, "lesson carries quiz");

  const oldFirst = await get(base, "/api/modules/essentials/lessons/what-is-linux");
  check(oldFirst.status === 200 && oldFirst.body.lesson.id === "what-is-linux", "lesson lookup still works");
  check(oldFirst.body.prev === "squid/acls-caching", "essentials first lesson now follows Squid");
  check(oldFirst.body.next === "essentials/first-login", "essentials next -> first-login");

  const last = await get(base, "/api/modules/scripting/lessons/backup-project");
  check(last.status === 200 && last.body.next === null, "last lesson has no next");
  check(last.body.prev === "scripting/control-flow", "last lesson prev -> control-flow");

  const noLesson = await get(base, "/api/modules/essentials/lessons/nope");
  check(noLesson.status === 404, "unknown lesson -> 404");

  const unknown = await get(base, "/api/nope");
  check(unknown.status === 404 && unknown.body.error, "unknown API route -> JSON 404");

  console.log("\nResult");
  console.log("  " + failures + " failure(s)");
  console.log("");

  process.exitCode = failures ? 1 : 0;
  server.close();
}
