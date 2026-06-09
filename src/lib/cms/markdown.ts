/**
 * Minimal, XSS-safe Markdown → HTML renderer.
 *
 * Strategy: escape ALL HTML first, then introduce only our own whitelisted
 * tags. Links are restricted to http(s)/relative/mailto. No raw HTML from the
 * input ever reaches the DOM — safe to use with dangerouslySetInnerHTML.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeHref(url: string): string {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(u)) return u;
  return "#";
}

function inline(text: string): string {
  let s = escapeHtml(text);
  // code
  s = s.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  // bold, italic
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const href = safeHref(url);
    const ext = /^https?:\/\//i.test(href);
    return `<a href="${escapeHtml(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });
  return s;
}

export function renderMarkdown(md: string): string {
  if (!md) return "";
  const blocks = md.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    if (/^#{1,6}\s/.test(block)) {
      const level = block.match(/^#+/)![0].length;
      const lvl = Math.min(Math.max(level, 1), 6);
      html.push(`<h${lvl}>${inline(block.replace(/^#+\s/, ""))}</h${lvl}>`);
    } else if (/^>\s/.test(block)) {
      const body = block
        .split("\n")
        .map((l) => inline(l.replace(/^>\s?/, "")))
        .join("<br/>");
      html.push(`<blockquote>${body}</blockquote>`);
    } else if (/^([-*])\s/.test(block)) {
      const items = block
        .split("\n")
        .filter((l) => /^[-*]\s/.test(l))
        .map((l) => `<li>${inline(l.replace(/^[-*]\s/, ""))}</li>`)
        .join("");
      html.push(`<ul>${items}</ul>`);
    } else if (/^\d+\.\s/.test(block)) {
      const items = block
        .split("\n")
        .filter((l) => /^\d+\.\s/.test(l))
        .map((l) => `<li>${inline(l.replace(/^\d+\.\s/, ""))}</li>`)
        .join("");
      html.push(`<ol>${items}</ol>`);
    } else if (/^(-{3,}|\*{3,})$/.test(block)) {
      html.push("<hr/>");
    } else {
      html.push(`<p>${block.split("\n").map(inline).join("<br/>")}</p>`);
    }
  }
  return html.join("\n");
}

export function countWords(md: string): number {
  const text = md.replace(/[#>*`\-[\]()]/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}
