/* Page render regression test.
   Loaded through Vite SSR by scripts/render-test.mjs so the JSX is compiled.
   Asserts that every topic page mounts without a runtime error and that the
   key content (title, lessons, nav links) is actually present in the output. */

import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

const vite = globalThis.__vite;
const { AuthProvider } = await vite.ssrLoadModule("/src/lib/auth.jsx");
const { default: App } = await vite.ssrLoadModule("/src/App.jsx");

const PAGES = [
  {
    path: "/squid-proxy/forward-proxy",
    expect: [
      "Forward Proxy",
      "Three more Squid setups to try next.",
      "Reverse Proxy",
      "Transparent Proxy",
    ],
    reject: ["Linux File Server", "Linux Mail Server"],
  },
  {
    path: "/squid-proxy/reverse-proxy",
    expect: ["Reverse Proxy", "Three more Squid setups to try next."],
    reject: ["Linux File Server", "Linux Mail Server"],
  },
  {
    path: "/file-server",
    expect: [
      "Linux File Server",
      "Samba",
      "NFS",
      "Back to Squid Proxy",
      "More topics to try next.",
      "Mail Server",
      "File Server",
    ],
    reject: ["Three more Squid setups to try next."],
  },
  {
    path: "/mail-server",
    expect: [
      "Linux Mail Server",
      "Postfix",
      "Dovecot",
      "Back to File Server",
      "More topics to try next.",
      "Mail Server",
      "File Server",
    ],
    reject: ["Three more Squid setups to try next."],
  },
];

let failures = 0;

for (const page of PAGES) {
  try {
    const html = renderToString(
      <MemoryRouter initialEntries={[page.path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    const problems = [];

    if (!html.includes("topic-title")) problems.push("missing topic-title");
    if (!html.includes("topic-lesson")) problems.push("missing topic-lesson");
    if (!html.includes("topic-siblings")) problems.push("missing topic-siblings");
    if (!html.includes("complete-btn")) problems.push("missing complete-btn");
    if (html.includes("failed to render")) problems.push("error boundary triggered");

    (page.expect || []).forEach(function (needle) {
      if (!html.includes(needle)) problems.push("missing text: " + needle);
    });
    (page.reject || []).forEach(function (needle) {
      if (html.includes(needle)) problems.push("unexpected text: " + needle);
    });

    if (problems.length) {
      failures++;
      console.log("FAIL  " + page.path + " -> " + problems.join(" | "));
    } else {
      console.log("ok    " + page.path + " (" + html.length + " chars)");
    }
  } catch (err) {
    failures++;
    console.log("FAIL  " + page.path + " -> " + (err && err.message ? err.message : String(err)));
  }
}

console.log(failures === 0 ? "\nAll pages rendered without runtime errors." : "\n" + failures + " page(s) failed.");
process.exit(failures === 0 ? 0 : 1);
