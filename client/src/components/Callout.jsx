import { InlineText } from "../lib/inline.jsx";

export default function Callout({ type, text }) {
  const isTip = type === "tip";
  return (
    <div className={"callout " + (isTip ? "callout-tip" : "callout-warn")}>
      <strong>{isTip ? "Tip" : "Watch out"}</strong>
      <InlineText text={text} />
    </div>
  );
}
