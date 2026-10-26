/* Renders the tiny inline markup used across lesson content:
   `code` spans and **bold** text, safely as React elements. */

const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*)/g;

export function InlineText({ text }) {
  if (text == null) return null;

  const parts = [];
  let last = 0;
  let key = 0;
  let match;

  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(<code key={"c" + key++}>{token.slice(1, -1)}</code>);
    } else {
      parts.push(<strong key={"b" + key++}>{token.slice(2, -2)}</strong>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}
