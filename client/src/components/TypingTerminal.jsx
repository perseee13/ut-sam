import { useEffect, useState } from "react";

const LINES = ["sudo apt update", "sudo apt upgrade", "systemctl status nginx"];
const DONE = "✓ Your server is running smoothly!";

/* Types the hero terminal's commands one character at a time, then reveals
   the success line. Decorative only — the parent .hero-art is aria-hidden,
   and prefers-reduced-motion users get the finished transcript instantly. */
export default function TypingTerminal() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(function () {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLineIndex(LINES.length);
      setDone(true);
      return undefined;
    }

    let alive = true;
    let timer = null;

    function tick() {
      if (!alive) return;
      if (lineIndex >= LINES.length) {
        setDone(true);
        return;
      }
      const line = LINES[lineIndex];
      if (charIndex < line.length) {
        setCharIndex(charIndex + 1);
        timer = window.setTimeout(tick, 30 + Math.random() * 45);
      } else {
        timer = window.setTimeout(function () {
          setLineIndex(lineIndex + 1);
          setCharIndex(0);
        }, 380);
      }
    }

    timer = window.setTimeout(tick, 550);
    return function () {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [lineIndex, charIndex]);

  return (
    <div className="term-body term-typed">
      {LINES.slice(0, lineIndex).map(function (line) {
        return (
          <p key={line}>
            <span className="tprompt">user@server</span>:~$ {line}
          </p>
        );
      })}
      {lineIndex < LINES.length ? (
        <p>
          <span className="tprompt">user@server</span>:~$ {LINES[lineIndex].slice(0, charIndex)}
          <span className="blink term-cursor">▊</span>
        </p>
      ) : null}
      {done ? <p className="tok term-done">{DONE}</p> : null}
    </div>
  );
}
