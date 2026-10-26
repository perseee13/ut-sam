import { useEffect } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import CodeBlock from "../components/CodeBlock.jsx";
import Callout from "../components/Callout.jsx";
import { InlineText } from "../lib/inline.jsx";
import { TOPIC_CARDS } from "../components/TopicSiblings.jsx";
import { progressStore, useProgress } from "../lib/progress.js";

function LessonArticle({ index, lesson, nextLesson }) {
  return (
    <article className="topic-lesson" id={lesson.id}>
      <p className="topic-lesson-top">
        <span className="topic-lesson-num">Step {String(index + 1).padStart(2, "0")}</span>
        <span className="crumb-sep">/</span>
        <span>{lesson.title}</span>
      </p>
      <div className="topic-lesson-head">
        <h2 className="topic-lesson-title">{lesson.title}</h2>
        <p className="topic-lesson-sum">{lesson.sum}</p>
        <p className="topic-lesson-meta">
          <span className="topic-chip">⏱ {lesson.min} min read</span>
          <span className="topic-chip topic-guide-chip">📘 Lab Manual</span>
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

    </article>
  );
}

function SiblingTopics({ current }) {
  const all = TOPIC_CARDS.filter(function (t) { return t.group === "squid" && t.slug !== current; });
  return (
    <section className="topic-siblings" aria-label="Keep exploring">
      <h2>Keep exploring</h2>
      <p className="topic-siblings-sub">Three more Squid setups to try next.</p>
      <div className="topic-sibling-grid">
        {all.map(function (t) {
          return (
            <Link className="topic-sibling" key={t.slug} to={t.to}>
              <span className="topic-sibling-icon" aria-hidden="true">{t.icon}</span>
              <strong>{t.title}</strong>
              <p>{t.sum}</p>
              <span className="topic-sibling-go">Open →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function SquidTopicPage({ topic, backTo, backLabel, siblings }) {
  useEffect(function () {
    document.title = topic.title + " — ServerPath";
  }, [topic.title]);

  const currentIndex = TOPIC_CARDS.findIndex(function (t) { return t.slug === topic.slug; });
  const prevTopic = currentIndex > 0 ? TOPIC_CARDS[currentIndex - 1] : null;
  const nextTopic = currentIndex >= 0 && currentIndex < TOPIC_CARDS.length - 1 ? TOPIC_CARDS[currentIndex + 1] : null;

  const progress = useProgress();
  const completeKey = "topic/" + topic.slug;
  const isComplete = progress.has(completeKey);

  return (
    <>
      <AppHeader />
      <main className="topic-dark" id="top">
        <div className="topic-hero">
          <div className="topic-hero-bg" aria-hidden="true">
            <span className="topic-orb topic-orb-a"></span>
            <span className="topic-orb topic-orb-b"></span>
            <span className="topic-grid"></span>
          </div>
          <div className="container topic-hero-inner">
            <div>
              <p className="topic-crumb">
                <Link to="/">Home</Link>
                <span className="topic-crumb-sep">/</span>
                <span>{topic.title}</span>
              </p>
              <p className="topic-badge">
                <span className="topic-badge-dot"></span>
                {topic.kicker}
              </p>
              <h1 className="topic-title">
                <span className="topic-icon" aria-hidden="true">{topic.icon}</span> {topic.title}
              </h1>
              <p className="topic-sum">{topic.sum}</p>
              <div className="topic-chips">
                {topic.meta.map(function (chip) {
                  const cleaned = chip.replace(/lessons?/i, "sections");
                  return <span className="topic-chip" key={chip}>{cleaned}</span>;
                })}
                <span className="topic-chip topic-chip-active">
                  <span className="chip-dot"></span> Live Lab Blueprint
                </span>
              </div>
              <div className="topic-actions">
                {topic.lessons && topic.lessons[0] ? (
                  <a className="btn btn-primary" href={"#" + topic.lessons[0].id}>
                    Jump to Guide ↓
                  </a>
                ) : null}
                <Link className="btn btn-ghost" to={backTo || "/squid-proxy"}>
                  {backLabel || "Back to overview"}
                </Link>
              </div>
            </div>
            <div className="topic-term" aria-hidden="true">
              <div className="topic-term-bar">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="topic-term-title">terminal — bash</span>
              </div>
              <div className="topic-term-body">
                {(topic.heroTerm || []).map(function (line, i) {
                  if (line.ok) return <p className="topic-term-ok" key={i}>{line.ok}</p>;
                  return <p key={i}><span className="topic-term-prompt">{line.prompt}@server</span>:~$ {line.cmd}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="topic-layout">
            <aside className="topic-toc" aria-label="On this page">
              <h2>On this page</h2>
              <ol>
                {topic.lessons.map(function (lesson, i) {
                  return (
                    <li key={lesson.id}>
                      <a href={"#" + lesson.id}>
                        <span className="topic-toc-num">{String(i + 1).padStart(2, "0")}</span>
                        <span>{lesson.title}</span>
                        <span className="topic-toc-min">{lesson.min}m</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
              <p className="topic-toc-foot">{topic.lessons.length} documentation steps</p>
            </aside>
            <div className="topic-lessons">
              {topic.lessons.map(function (lesson, i) {
                const nextLesson = topic.lessons[i + 1] || null;
                return (
                  <LessonArticle
                    key={lesson.id}
                    index={i}
                    lesson={lesson}
                    nextLesson={nextLesson}
                  />
                );
              })}

              {/* Next / Previous Module Navigation */}
              {(prevTopic || nextTopic) && (
                <nav className="module-pagination" aria-label="Topic Navigation">
                  {prevTopic ? (
                    <Link to={prevTopic.to} className="mod-nav-card mod-nav-prev">
                      <span className="mod-nav-direction">← Previous Module</span>
                      <strong className="mod-nav-title">{prevTopic.icon} {prevTopic.title}</strong>
                      <span className="mod-nav-sum">{prevTopic.sum}</span>
                    </Link>
                  ) : <div className="mod-nav-placeholder" />}

                  {nextTopic ? (
                    <Link to={nextTopic.to} className="mod-nav-card mod-nav-next">
                      <span className="mod-nav-direction">Next Module →</span>
                      <strong className="mod-nav-title">{nextTopic.icon} {nextTopic.title}</strong>
                      <span className="mod-nav-sum">{nextTopic.sum}</span>
                    </Link>
                  ) : <div className="mod-nav-placeholder" />}
                </nav>
              )}

              <div className="topic-complete-wrap">
                <button
                  type="button"
                  className={"btn btn-primary complete-btn" + (isComplete ? " is-done" : "")}
                  onClick={function () { progressStore.toggle(completeKey); }}
                >
                  {isComplete ? "✓ Completed — undo?" : "Mark as complete"}
                </button>
              </div>

              {siblings ? siblings : <SiblingTopics current={topic.slug} />}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
