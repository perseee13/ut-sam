import { useState } from "react";
import { copyText } from "../lib/clipboard.js";

export default function CodeBlock({ block }) {
  const [label, setLabel] = useState("copy");
  const [copied, setCopied] = useState(false);

  function onCopy() {
    copyText(block.x).then(function () {
      setLabel("copied!");
      setCopied(true);
      window.setTimeout(function () {
        setLabel("copy");
        setCopied(false);
      }, 1400);
    }).catch(function () {
      setLabel("press Ctrl+C");
    });
  }

  return (
    <figure className="codeblock">
      <figcaption className="code-head">
        <span className="code-lang">{block.lang || "bash"}</span>
        {block.title ? <span className="code-title">{block.title}</span> : null}
        <button
          type="button"
          className={"code-copy" + (copied ? " is-copied" : "")}
          onClick={onCopy}
        >
          {label}
        </button>
      </figcaption>
      <pre><code>{block.x}</code></pre>
    </figure>
  );
}
