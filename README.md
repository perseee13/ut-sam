# ServerPath — Linux servers

A self-paced learning site about running and operating Linux servers: the shell, files,
permissions, services, networking, security, and shell scripting.

**23 lessons · 7 modules · ~4 hours of guided reading · progress saved on your device.**

Two parts, one course:

| Folder | Stack | What it is |
| --- | --- | --- |
| `server/` | **Express.js** | JSON API for all course content, serves the built web client in production |
| `client/` | **React** (Vite SPA) | The website: home, lesson viewer with quizzes + progress |
| `index.html` … | plain HTML/CSS/JS | The original zero-dependency static site (still works, still tested) |

## Quick start — full stack (Express + React web)

```bash
npm --prefix server install     # once
npm --prefix client install     # once

npm run dev:server              # API at http://localhost:4000
npm run dev:client              # website at http://localhost:5173 (proxies /api to :4000)
```

Production (one server for everything — same build hosts use):

```bash
npm run build:client            # builds client/dist
npm run start:api               # Express serves the API + the built site on :4000
# o isang command:
npm run start:prod
```

## Ubuntu Server (sabi ni prof — dito iho-host, IP ang pang-access)

> Logic: dalhin ang folder sa Ubuntu Server, i-start doon, kung anong
> `http://IP:4000` ang lumabas, yun ang itype sa browser ng kahit anong
> device na nakaabot sa server.

```bash
# 1. i-copy ang project sa server, tapos isang setup lang:
chmod +x setup-ubuntu.sh scripts/start-ubuntu.sh
./setup-ubuntu.sh

# 2. i-start (magpi-print ng IP na itype ng ibang device):
npm run start:prod
# o:  bash scripts/start-ubuntu.sh
# o:  PORT=4000 HOST=0.0.0.0 npm --prefix server start
```

Pag nag-start, ganito lalabas:

```
  ================================================
   ServerPath running!
  ================================================
   Sa server na ito buksan: http://localhost:4000

   PANG-ACCESS NG IBANG DEVICE (kahit anong network
   basta abot ang server, itype lang ito sa browser):
     -> http://192.168.x.x:4000  [eth0]
     -> http://10.x.x.x:4000     [eth1]

   Halimbawa sa phone/laptop browser:
     http://192.168.x.x:4000
```

Sa ibang phone/laptop, sa browser itype lang yung isa sa mga `->` lines.
Manual check sa server: `hostname -I` at `ss -tlnp | grep 4000`.

**Kapag same machine / classroom LAN lang:** goods na agad — walang
kailangang baguhin, naka-`0.0.0.0` na (`server/index.js`,
`scripts/serve.js`, `client/vite.config.js`).

**Kapag ibang building / ibang internet talaga (hindi abot ang IP):**
classroom LAN lang ang abot ng private IP. Kung kailangan ibang network,
gamitin `npm run share` (ngrok) o i-deploy (Render/Railway) — nasa baba.

**Auto-start pag nag-reboot ang Ubuntu (systemd):**

```bash
# 1. edit serverpath.service — palitan WorkingDirectory ng actual path:
#      WorkingDirectory=/home/student/Antoniano-ut-Project
sudo cp serverpath.service /etc/systemd/system/serverpath.service
sudo systemctl daemon-reload
sudo systemctl enable --now serverpath
sudo systemctl status serverpath
# logs: journalctl -u serverpath -f
# check: curl http://localhost:4000/api/health
```

## Open sa internet (ngrok share / Render / Railway / Docker)

Yung `http://192.168.x.x:4000` pang-same-WiFi lang. Para kahit ibang
internet makabukas, kailangan ng public URL. Dalawang paraan:

**A. Demo / share agad (PC mo bukas, 2 mins):**

```bash
npm run share
# magpi-print ng https://xxxx.ngrok-free.app — yun ang isend mo.
# Kahit naka-data sila, bubukas. Isara mo ngrok/PC, wala na rin.
```

Kailangan minsan ng free authtoken (isang beses lang):

```bash
npx ngrok config add-authtoken <token>   # galing https://dashboard.ngrok.com/get-started/your-authtoken
```

Fallback kung ayaw ng ngrok (no account):

```bash
npm run build:client
npm run start:api                        # terminal 1
npx -y localtunnel --port 4000           # terminal 2
```

**B. Permanent link kahit patay PC mo (Render / Railway, free):**

1. I-push mo tong folder sa GitHub.
2. Render: New + → Web Service → piliin repo mo.
   - Build: `npm run render-build`
   - Start: `npm run render-start`
   - (o auto-detect via `render.yaml` na kasama na dito)
   - Health check: `/api/health`
3. Railway: New Project → Deploy from Repo → auto-detect via `railway.json`.
4. Buksan yung binigay na `https://...onrender.com` — kahit sino, kahit saang internet.

Docker option (kahit saan nagra-run ng container):

```bash
docker build -t serverpath .
docker run -p 4000:4000 serverpath
```

## Checks & tests

```bash
npm run check                   # content validator + DOM smoke test + React page render test
npm test                        # serves the legacy static site and fetches every page/asset
npm run test:api                # Express API test — boots on a random port
```

`npm run check` runs three passes:

| Pass | What it catches |
| --- | --- |
| `validate-content.js` | broken ids, quiz wiring, missing page assets |
| `smoke-test.js` | runtime errors in the legacy static-site scripts |
| `render-test.js` | runtime errors in the React pages (undefined identifier, bad hook usage, missing prop) |

`render-test.js` boots Vite in middleware mode and renders every React route
through `react-dom/server`. It needs the client dependencies
(`npm --prefix client install`) and skips itself when they are missing.

## Legacy static site (no build, still working)

Open `index.html` in your browser, or `npm start` (serves the folder at
http://localhost:5173). Pages:

| `index.html` | Landing page: hero, stats, full curriculum grid (rendered from course data) |

## Project structure

```
├── index.html                     legacy static site (still works, still tested)
├── assets/                                   legacy content + theme (source of truth)
│   ├── css/style.css                         the whole theme (also ported to client/src/styles.css)
│   └── js/
│       ├── lessons.js                        shared helpers (storage, escaping, course registry)
│       ├── data-*.js                          course content — one file per module
│       ├── app.js                            landing page renderer
├── scripts/                                  checks for the legacy site
│   ├── validate-content.js                   content validator (ids, quizzes, wiring)
│   ├── smoke-test.js                         legacy static-site DOM smoke test
│   └── render-test.js                        React page render test (Vite SSR + react-dom/server)
├── server/                                   Express.js backend (Express 5 + cors)
│   ├── app.js                                API + built-client hosting, exported via createApp()
│   ├── catalog.js                            loads server/data/*.json, computes prev/next + stats
│   ├── index.js                              listens on :4000
│   ├── data/course.json                      imported course (npm run import)
│   ├── scripts/import-content.js             imports assets/js/data-*.js → server/data/*.json
│   └── test/api-test.js                      API test (npm run test:api)
└── client/                                   React web frontend (React 19 + Vite + react-router)
    ├── tests/                                render test cases (see scripts/render-test.js)
    └── src/                                  pages, components, api client (/api proxied to :4000)
        ├── data/                             topic content (one file per topic)
        └── bits/                             React Bits animation components (vendored source)
```

## React Bits animations (web client)

The React client uses [React Bits](https://reactbits.dev) components, vendored as source you own
in `client/src/bits/` (JS + plain CSS variants, pulled from the official React Bits registry —
see https://reactbits.dev/get-started/installation). They are wired into the landing page:

| Component | Where it's used | What it does |
|---|---|---|
| `SplitText` | hero H1 + section headings | staggered per-letter / per-word reveal (gsap) |
| `DecryptedText` | hero kicker | terminal-style scramble-in text (motion) |
| `BlurText` | "Why Linux Servers?" paragraph | soft-focus word-by-word reveal (motion) |
| `CountUp` | landing stats | animated number counters (motion) |
| `SpotlightCard` | feature cards + curriculum module cards | pointer-following spotlight + edge glow |
| `GlareHover` | "Learn More" hero button | diagonal glare sweep on hover |
| `Magnet` | primary hero buttons | magnetic pull toward the cursor |
| `ShinyText` | hero badge + handwritten freedom note | looping shine sweep |
| `ClickSpark` | whole landing page | spark burst on click |

Dependencies added to `client/package.json`: `gsap`, `@gsap/react`, `motion`.

To add another component: copy its JS-CSS variant from the component page on reactbits.dev into
`client/src/bits/`, install the dependency it lists, and import it. The CSS glue for these
components lives at the bottom of `client/src/extras.css`. All effects respect the existing
light theme, and looping effects honor `prefers-reduced-motion`.

## Adding or editing lessons

Content is plain data. Open the relevant `assets/js/data-<module>.js` and follow the pattern:

```js
{
  id: "lesson-id",                 // unique inside its module, used in URLs
  title: "Lesson title",
  min: 10,                         // estimated minutes
  sum: "One-sentence summary shown under the title.",
  blocks: [
    { t: "p",    x: "Paragraph. Inline `code` and **bold** are supported." },
    { t: "h",    x: "Sub-heading" },
    { t: "ul",   x: ["Bullet one", "Bullet two"] },
    { t: "code", lang: "bash", title: "Optional caption", x: "ls -lah" },
    { t: "tip",  x: "A green callout." },
    { t: "warn", x: "A yellow warning callout." }
  ],
  quiz: [
    { q: "Question?", opts: ["A", "B", "C"], a: 1, why: "Why B is right." }
  ]
}
```

To add a whole new module, create `assets/js/data-yourmodule.js` in the same shape, then add a
`<script>` tag for it in `index.html` (after `lessons.js`, before `app.js`).
Then re-import into the API and rebuild/restart:

```bash
npm run check
cd server && npm run import && npm test   # course.json refreshed, API green
```
Run `npm run check` afterwards — it verifies IDs, quizzes and page wiring for you.

## Notes

- Progress (completed lessons) is stored in `localStorage` under `serverpath.progress.v1`; the reset button is in the learner header.
- Commands and conventions target Debian/Ubuntu; Red Hat family differences are called out inline as they matter.
- Practice on a machine you own — a throwaway VM or a free-tier cloud instance is perfect.



