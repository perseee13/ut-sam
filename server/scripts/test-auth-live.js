#!/usr/bin/env node
/* Live auth test against a running MySQL: register -> login -> me.
   Run:  node server/scripts/test-auth-live.js  (MySQL must be up) */
"use strict";

const { createApp } = require("../../server/app");

const app = createApp();
const server = app.listen(4567, async function () {
  const base = "http://127.0.0.1:4567";
  let code = 0;
  try {
    const email = "test" + Date.now() + "@example.com";

    let res = await fetch(base + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: email, password: "secret123" })
    });
    console.log("REGISTER ->", res.status, JSON.stringify(await res.json()).slice(0, 220));
    if (res.status !== 201) code = 1;

    res = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: "secret123" })
    });
    const login = await res.json();
    console.log("LOGIN ->", res.status, "user:", JSON.stringify(login.user));
    if (res.status !== 200 || !login.token) code = 1;

    if (login.token) {
      res = await fetch(base + "/api/auth/me", {
        headers: { Authorization: "Bearer " + login.token }
      });
      console.log("ME ->", res.status, JSON.stringify(await res.json()));
      if (res.status !== 200) code = 1;
    }

    // wrong password must fail
    res = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: "wrongpass" })
    });
    console.log("WRONG-PASS ->", res.status, JSON.stringify(await res.json()));
    if (res.status !== 401) code = 1;

    console.log(code === 0 ? "\nALL AUTH TESTS PASSED" : "\nAUTH TESTS FAILED");
  } catch (err) {
    console.log("ERR", err.message);
    code = 1;
  }
  server.close();
  process.exit(code);
});
