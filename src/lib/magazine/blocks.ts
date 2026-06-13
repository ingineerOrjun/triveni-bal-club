/**
 * Block registry for the magazine article editor.
 *
 * Framework-agnostic (no React) so it can be imported from server actions,
 * the public renderer, and the client editor alike. Each block is stored as a
 * row in `magazine_article_blocks` ({ block_type, sort_order, hidden, data }).
 * New block types are added here once and become available everywhere.
 */

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "gallery"
  | "quote"
  | "divider"
  | "code"
  | "table"
  | "callout"
  | "video"
  | "button"
  | "list"
  | "checklist"
  | "columns"
  | "stats"
  | "media";

/** A single editable block as held in the editor / serialized to the DB. */
export interface ArticleBlock {
  id: string;
  type: BlockType;
  hidden: boolean;
  data: Record<string, unknown>;
}

export interface BlockDef {
  type: BlockType;
  label: string;
  /** lucide-react icon name, resolved by the client editor. */
  icon: string;
  group: "text" | "media" | "layout" | "interactive";
  /** Factory for a fresh block's `data`. */
  create: () => Record<string, unknown>;
}

export const BLOCK_DEFS: BlockDef[] = [
  { type: "heading", label: "Heading", icon: "Heading", group: "text", create: () => ({ text: "", level: 2 }) },
  { type: "paragraph", label: "Paragraph", icon: "Pilcrow", group: "text", create: () => ({ text: "" }) },
  { type: "quote", label: "Quote", icon: "Quote", group: "text", create: () => ({ text: "", cite: "" }) },
  { type: "list", label: "List", icon: "List", group: "text", create: () => ({ ordered: false, items: [""] }) },
  { type: "checklist", label: "Checklist", icon: "ListChecks", group: "text", create: () => ({ items: [{ text: "", checked: false }] }) },
  { type: "code", label: "Code", icon: "Code", group: "text", create: () => ({ code: "", language: "" }) },
  { type: "callout", label: "Callout", icon: "Info", group: "text", create: () => ({ tone: "info", title: "", text: "" }) },
  { type: "table", label: "Table", icon: "Table", group: "text", create: () => ({ headers: ["", ""], rows: [["", ""]] }) },
  { type: "image", label: "Image", icon: "Image", group: "media", create: () => ({ url: "", alt: "", caption: "" }) },
  { type: "gallery", label: "Gallery", icon: "Images", group: "media", create: () => ({ images: [] }) },
  { type: "video", label: "Video embed", icon: "Video", group: "media", create: () => ({ url: "", caption: "" }) },
  { type: "media", label: "Rich media", icon: "FileVideo", group: "media", create: () => ({ url: "", kind: "embed", caption: "" }) },
  { type: "divider", label: "Divider", icon: "Minus", group: "layout", create: () => ({}) },
  { type: "columns", label: "Two columns", icon: "Columns2", group: "layout", create: () => ({ left: "", right: "" }) },
  { type: "stats", label: "Statistics", icon: "BarChart3", group: "layout", create: () => ({ items: [{ label: "", value: "" }] }) },
  { type: "button", label: "Button", icon: "MousePointerClick", group: "interactive", create: () => ({ label: "", href: "" }) },
];

const BY_TYPE = new Map<BlockType, BlockDef>(BLOCK_DEFS.map((d) => [d.type, d]));

export function getBlockDef(type: string): BlockDef | undefined {
  return BY_TYPE.get(type as BlockType);
}

export function isBlockType(type: string): type is BlockType {
  return BY_TYPE.has(type as BlockType);
}

/** Stable id for new editor blocks (crypto where available). */
export function newBlockId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `b-${Math.abs(hashString(String(BLOCK_DEFS.length)))}`;
  }
}
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

/** Read a string field from a block's loosely-typed data. */
function str(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}

/**
 * Flatten visible blocks to plain text — used to populate the searchable
 * `content` column, derive an excerpt, and estimate reading time.
 */
export function blocksToPlainText(blocks: ArticleBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.hidden) continue;
    const d = b.data ?? {};
    switch (b.type) {
      case "heading":
      case "paragraph":
      case "quote":
      case "callout":
        parts.push(str(d, "title"), str(d, "text"));
        break;
      case "list": {
        const items = Array.isArray(d.items) ? (d.items as unknown[]) : [];
        for (const it of items) if (typeof it === "string") parts.push(it);
        break;
      }
      case "checklist": {
        const items = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : [];
        for (const it of items) parts.push(str(it, "text"));
        break;
      }
      case "columns":
        parts.push(str(d, "left"), str(d, "right"));
        break;
      case "code":
        parts.push(str(d, "code"));
        break;
      case "image":
      case "video":
      case "media":
        parts.push(str(d, "caption"));
        break;
      case "table": {
        const rows = Array.isArray(d.rows) ? (d.rows as unknown[]) : [];
        for (const row of rows)
          if (Array.isArray(row)) for (const c of row) if (typeof c === "string") parts.push(c);
        break;
      }
      case "stats": {
        const items = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : [];
        for (const it of items) parts.push(str(it, "label"), str(it, "value"));
        break;
      }
      default:
        break;
    }
  }
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/** Estimate reading time in minutes from plain text (~200 wpm). */
export function estimateReadingTime(text: string): number {
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** Derive a short excerpt from plain text. */
export function deriveExcerpt(text: string, max = 200): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
