#!/usr/bin/env node
/* One-command public share for demos: builds the client, boots the API that
   also serves it (single port), then opens a public URL via a tunnel so ANY
   internet (ibang WiFi / mobile data) can open the site.
   Usage:  npm run share   (then send the printed https URL)
   Needs:  ngrok authtoken once ->  npx ngrok config add-authtoken <token>
   Alt (no account):  npx localtunnel --port 4000
*/
"use strict";

const { spawn } = require("child_process");

const PORT = Number(process.env.PORT) || 4000;

function run(cmd, args, opts) {
  return new Promise(function (resolve, reject) {
    const p = spawn(cmd, args, Object.assign({ stdio: "inherit", shell: true }, opts));
    p.on("error", reject);
    p.on("exit", function (code) {
      if (code === 0) resolve();
      else reject(new Error(cmd + " " + args.join(" ") + " exited " + code));
    });
  });
}

async function main() {
  console.log("\n  [1/3] building client (client/dist) ...");
  await run("npm", ["--prefix", "client", "run", "build"]);

  console.log("\n  [2/3] starting API+site on :" + PORT + " ...");
  const server = spawn("node", ["server/index.js"], {
    stdio: "inherit",
    shell: true,
    env: Object.assign({}, process.env, { PORT: String(PORT) })
  });
  server.on("error", function (e) { console.error(e); process.exit(1); });

  /* wait a bit for the server to be up */
  await new Promise(function (r) { setTimeout(r, 3500); });

  console.log("\n  [3/3] opening public tunnel (kahit ibang internet pwede na) ...");
  console.log("  Kung ngrok hingi ng authtoken: gumawa sa https://dashboard.ngrok.com/get-started/your-authtoken");
  console.log("  tapos:  npx ngrok config add-authtoken <token>\n");

  const tun = spawn("npx", ["-y", "ngrok", "http", String(PORT)], { stdio: "inherit", shell: true });
  tun.on("error", function () {
    console.log("\n  ngrok failed — try fallback:  npx -y localtunnel --port " + PORT);
  });

  function stop() { try { tun.kill(); } catch (e) {} try { server.kill(); } catch (e) {} }
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch(function (e) { console.error(e.message); process.exit(1); });
