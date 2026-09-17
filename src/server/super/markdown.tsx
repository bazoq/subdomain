/**
 * Tiny markdown -> React renderer used by the super blog (admin preview + public pages).
 * Supports: headings (#..####), paragraphs, **bold**, *italic*, `code`, fenced code blocks,
 * [links](url), images ![alt](url), ordered/unordered lists, blockquotes and horizontal rules.
 * No HTML passthrough — everything is rendered as text nodes, so it is XSS-safe by construction.
 * Pure module (no "server-only") so the client-side live preview can reuse it.
 */
import type { ReactNode } from "react";

/* ---------- inline ---------- */

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(url: string) {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u)) return u;
  return "#";
}

export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    const key = `${keyPrefix}-${k++}`;
    if (tok.startsWith("**") || tok.startsWith("__")) out.push(<strong key={key}>{renderInline(tok.slice(2, -2), key)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("![")) {
      const mm = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(tok);
      // eslint-disable-next-line @next/next/no-img-element
      if (mm) out.push(<img key={key} src={safeHref(mm[2])} alt={mm[1]} loading="lazy" />);
    } else if (tok.startsWith("[")) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      if (mm) {
        const href = safeHref(mm[2]);
        const external = /^https?:\/\//i.test(href);
        out.push(
          <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {renderInline(mm[1], key)}
          </a>,
        );
      }
    } else out.push(<em key={key}>{renderInline(tok.slice(1, -1), key)}</em>);
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ---------- blocks ---------- */

type Block =
  | { type: "h"; level: number; text: string }
  | { type: "p"; text: string }
  | { type: "code"; lang: string; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" };

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ type: "h", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ type: "ol", items });
      continue;
    }
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: buf.join(" ") });
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i]) && !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
      buf.push(lines[i++].trim());
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

/** Server-safe renderer: returns React nodes (wrap them in a `.prose`-style container yourself). */
export function renderMarkdown(md: string): ReactNode {
  const blocks = parseMarkdown(md ?? "");
  return blocks.map((b, i) => {
    const key = `b${i}`;
    switch (b.type) {
      case "h": {
        const inner = renderInline(b.text, key);
        if (b.level === 1) return <h1 key={key}>{inner}</h1>;
        if (b.level === 2) return <h2 key={key}>{inner}</h2>;
        if (b.level === 3) return <h3 key={key}>{inner}</h3>;
        return <h4 key={key}>{inner}</h4>;
      }
      case "p":
        return <p key={key}>{renderInline(b.text, key)}</p>;
      case "code":
        return (
          <pre key={key} data-lang={b.lang || undefined}>
            <code>{b.text}</code>
          </pre>
        );
      case "ul":
        return (
          <ul key={key}>
            {b.items.map((it, j) => (
              <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={key}>
            {b.items.map((it, j) => (
              <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
            ))}
          </ol>
        );
      case "quote":
        return <blockquote key={key}>{renderInline(b.text, key)}</blockquote>;
      case "hr":
        return <hr key={key} />;
    }
  });
}

/** Plain-text excerpt (first ~n chars without markdown syntax), handy for meta descriptions. */
export function markdownToText(md: string, max = 200): string {
  const text = (md ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
