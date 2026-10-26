import { useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import CodeBlock from "../components/CodeBlock.jsx";
import Callout from "../components/Callout.jsx";
import { InlineText } from "../lib/inline.jsx";
import { getModule } from "../api.js";
import { useAsync } from "../lib/useAsync.js";
import { progressStore, useProgress } from "../lib/progress.js";

const SQUID_SUITE = [
  {
    to: "/squid-proxy/forward-proxy",
    title: "Forward Proxy",
    port: "Port 3128",
    icon: "➡️",
    desc: "Cache LAN web traffic, throttle heavy downloads, and apply domain blacklists for office or home networks.",
    tag: "Most Common",
    time: "15 min"
  },
  {
    to: "/squid-proxy/reverse-proxy",
    title: "Reverse Proxy",
    port: "Port 80 / 443",
    icon: "🔁",
    desc: "Position Squid in front of origin web applications to offload TLS, serve cached static assets, and shield backends.",
    tag: "High Traffic",
    time: "15 min"
  },
  {
    to: "/squid-proxy/transparent-proxy",
    title: "Transparent Proxy",
    port: "Gateway NAT",
    icon: "👻",
    desc: "Intercept client HTTP traffic at the Linux gateway with iptables without needing browser proxy configuration.",
    tag: "Zero-Config",
    time: "15 min"
  },
  {
    to: "/squid-proxy/intercept-ssl-bump",
    title: "Intercept & SSL Bump",
    port: "HTTPS Filtering",
    icon: "🔒",
    desc: "Inspect encrypted HTTPS traffic using a generated Certificate Authority (CA) certificate installed on clients.",
    tag: "Security / Audit",
    time: "20 min"
  }
];

function Quiz({ lesson }) {
  const [picked, setPicked] = useState({});
  return (
    <div className="quiz">
      <h2>Check yourself</h2>
      <p className="quiz-hint">Pick an answer — the explanation shows right away.</p>
      {lesson.quiz.map(function (item, qi) {
        const choice = picked[qi];
        return (
          <div className="quiz-q" key={qi}>
            <p className="q-text">{qi + 1}. {item.q}</p>
            <div className="quiz-opts">
              {item.opts.map(function (opt, oi) {
                let cls = "quiz-opt";
                if (choice !== undefined) {
                  if (oi === item.a) cls += " correct";
                  else if (oi === choice) cls += " wrong";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    disabled={choice !== undefined}
                    onClick={function () {
                      setPicked(function (prev) {
                        const next = Object.assign({}, prev);
                        next[qi] = oi;
                        return next;
                      });
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {choice !== undefined ? <p className="quiz-why">{item.why}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function LessonArticle({ index, lesson, nextLesson }) {
  return (
    <article className="lesson squid-lesson" id={lesson.id}>
      <p className="lesson-crumb">
        <span className="lesson-num">Step {String(index + 1).padStart(2, "0")}</span>
        <span className="crumb-module">Squid Proxy</span>
        <span className="crumb-sep">/</span>
        <span>{lesson.title}</span>
      </p>
      <div className="lesson-head">
        <h2>{lesson.title}</h2>
        <p className="lesson-summary">{lesson.sum}</p>
        <p className="lesson-meta">
          <span className="meta-chip">⏱ {lesson.min} min read</span>
          <span className="meta-chip">🦑 Architecture Blueprint</span>
        </p>
      </div>
      <div className="lesson-body">
        {lesson.blocks.map(function (block, i) {
          if (block.t === "h") return <h2 key={i}>{block.x}</h2>;
          if (block.t === "p") return <p key={i}><InlineText text={block.x} /></p>;
          if (block.t === "ul") {
            return (
              <ul className="lesson-list" key={i}>
                {block.x.map(function (item, j) {
                  return <li key={j}><InlineText text={item} /></li>;
                })}
              </ul>
            );
          }
          if (block.t === "code") return <CodeBlock key={i} block={block} />;
          if (block.t === "tip") return <Callout key={i} type="tip" text={block.x} />;
          if (block.t === "warn") return <Callout key={i} type="warn" text={block.x} />;
          if (block.t === "img") {
            return (
              <figure className="lesson-figure" key={i}>
                <div className="lesson-figure-frame">
                  <img
                    src={block.src}
                    alt={block.alt || block.caption || "Architecture Diagram"}
                    className="lesson-diagram-img"
                    loading="lazy"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="lesson-figcaption">
                    <span className="fig-badge">ARCHITECTURE DIAGRAM</span>
                    <span>{block.caption}</span>
                  </figcaption>
                ) : null}
              </figure>
            );
          }
          return null;
        })}
      </div>
      {lesson.quiz && lesson.quiz.length > 0 ? <Quiz lesson={lesson} /> : null}

    </article>
  );
}

export default function SquidProxyPage() {
  const squid = useAsync(function () { return getModule("squid"); }, []);
  const [copied, setCopied] = useState(false);

  function copyText(txt) {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  }

  const sampleSquidConf = `# /etc/squid/squid.conf - Minimal Production Forward Proxy
http_port 3128

# ACLs (Access Control Lists)
acl localnet src 192.168.1.0/24
acl localnet src 10.0.0.0/8
acl SSL_ports port 443
acl Safe_ports port 80 443 21 1025-65535

# Access Rules
http_access deny !Safe_ports
http_access deny CONNECT !SSL_ports
http_access allow localhost manager
http_access deny manager
http_access allow localnet
http_access allow localhost
http_access deny all

# Memory & Disk Caching
cache_mem 256 MB
maximum_object_size 50 MB
cache_dir ufs /var/spool/squid 4096 16 256`;

  return (
    <>
      <AppHeader />
      <main className="squid-page">
        {/* Squid Hero */}
        <div className="squid-hero">
          <div className="squid-hero-bg" aria-hidden="true">
            <span className="squid-orb squid-orb-a"></span>
            <span className="squid-orb squid-orb-b"></span>
            <span className="squid-grid"></span>
          </div>

          <div className="container squid-hero-inner">
            <p className="kicker"><span className="kicker-dot"></span>Comprehensive Proxy Lab</p>
            <h1><span className="squid-emoji" aria-hidden="true">🦑</span> Squid Proxy Suite</h1>
            <p className="section-sub">
              Squid is the industry-standard open-source web proxy and caching engine. It improves network performance, enforces security policies, and reduces external bandwidth consumption.
            </p>

            <div className="squid-hero-meta">
              <span className="meta-chip">⚡ 4 Architectural Models</span>
              <span className="meta-chip">⏱ ~65 min hands-on</span>
              <span className="meta-chip">🔌 Port 3128 / 80 / 443</span>
            </div>

            <div className="squid-hero-actions">
              <Link className="btn btn-primary" to="/squid-proxy/forward-proxy">
                Start with Forward Proxy →
              </Link>
              <a className="btn btn-ghost" href="#squid-architecture">
                Compare Architectures
              </a>
            </div>
          </div>
        </div>

        <div className="container">
          {/* Architecture visual flow */}
          <div className="squid-how" id="squid-how">
            <div className="squid-how-card">
              <span aria-hidden="true">💻</span>
              <div>
                <strong>Client LAN</strong>
                <p>Browsers, phones, internal servers</p>
              </div>
            </div>
            <span className="squid-how-arrow" aria-hidden="true">→</span>
            <div className="squid-how-card is-squid">
              <span aria-hidden="true">🦑</span>
              <div>
                <strong>Squid Proxy</strong>
                <p>Inspects ACLs, serves from disk cache</p>
              </div>
            </div>
            <span className="squid-how-arrow" aria-hidden="true">→</span>
            <div className="squid-how-card">
              <span aria-hidden="true">🌐</span>
              <div>
                <strong>Target Servers</strong>
                <p>Fetches fresh copy on cache-miss</p>
              </div>
            </div>
          </div>

          {/* 4 Squid Proxy Modes Launch Grid */}
          <section className="section" id="squid-architecture">
            <div className="section-head text-center">
              <p className="kicker">Four Real-World Deployments</p>
              <h2>Select a Squid Proxy Architecture</h2>
              <p className="section-sub">Each architecture satisfies different enterprise and network needs.</p>
            </div>

            <div className="squid-suite-grid">
              {SQUID_SUITE.map(function (item) {
                return (
                  <div key={item.to} className="squid-suite-card">
                    <div className="ssc-top">
                      <span className="ssc-icon">{item.icon}</span>
                      <span className="ssc-tag">{item.tag}</span>
                      <span className="ssc-port">{item.port}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <div className="ssc-foot">
                      <span className="ssc-time">⏱ {item.time}</span>
                      <Link to={item.to} className="btn btn-primary btn-sm ssc-btn">
                        Launch Lab →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interactive Reference Configuration */}
          <section className="section">
            <div className="config-showcase-card">
              <div className="config-header">
                <div>
                  <p className="kicker">Production Blueprint</p>
                  <h3>Standard squid.conf Configuration</h3>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={function () { copyText(sampleSquidConf); }}
                >
                  {copied ? "✓ Copied!" : "Copy Configuration"}
                </button>
              </div>
              <pre className="config-code">
                <code>{sampleSquidConf}</code>
              </pre>
            </div>
          </section>

          {/* If the express API provided extra lessons, render them here */}
          {squid.status === "ready" && squid.data && squid.data.module && squid.data.module.lessons ? (
            <div className="squid-lessons">
              <h2 className="lessons-divider-title">Core Squid Architecture & Concept Guides</h2>
              {squid.data.module.lessons.map(function (lesson, i) {
                const nextLesson = squid.data.module.lessons[i + 1] || null;
                return (
                  <LessonArticle
                    key={lesson.id}
                    index={i}
                    lesson={lesson}
                    nextLesson={nextLesson}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
