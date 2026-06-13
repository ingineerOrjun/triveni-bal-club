"use client";

import * as React from "react";
import {
  Heading,
  Pilcrow,
  Quote,
  List,
  ListChecks,
  Code,
  Info,
  Table,
  Image as ImageIcon,
  Images,
  Video,
  FileVideo,
  Minus,
  Columns2,
  BarChart3,
  MousePointerClick,
  Plus,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BLOCK_DEFS,
  getBlockDef,
  newBlockId,
  type ArticleBlock,
  type BlockType,
} from "@/lib/magazine/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/media/media-picker";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heading, Pilcrow, Quote, List, ListChecks, Code, Info, Table,
  Image: ImageIcon, Images, Video, FileVideo, Minus, Columns2, BarChart3, MousePointerClick,
};

function get(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}

/* ------------------------------ media helpers ----------------------------- */
function ImageBlockEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const url = get(data, "url");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-line bg-background-subtle">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-soft"><ImageIcon className="size-6" /></span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <ImageIcon className="size-4" /> {url ? "Change" : "Choose image"}
          </Button>
          {url ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ url: "" })}>
              <X className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      <Input placeholder="Alt text (for accessibility)" value={get(data, "alt")} onChange={(e) => onChange({ alt: e.target.value })} />
      <Input placeholder="Caption (optional)" value={get(data, "caption")} onChange={(e) => onChange({ caption: e.target.value })} />
      <MediaPicker open={open} onOpenChange={setOpen} onSelect={(f) => onChange({ url: f.public_url ?? f.thumbnail_url ?? "" })} />
    </div>
  );
}

function GalleryBlockEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const images = (Array.isArray(data.images) ? data.images : []) as Record<string, unknown>[];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-line bg-background-subtle">
            {get(img, "url") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={get(img, "url")} alt="" className="size-full object-cover" />
            ) : null}
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange({ images: images.filter((_, j) => j !== i) })}
              className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-ink/80 text-ink-inverse"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add image
      </Button>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        onSelect={(f) => onChange({ images: [...images, { url: f.public_url ?? f.thumbnail_url ?? "" }] })}
      />
    </div>
  );
}

/* ----------------------------- block body editor -------------------------- */
function BlockBody({
  block,
  onChange,
}: {
  block: ArticleBlock;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const d = block.data ?? {};
  switch (block.type) {
    case "heading":
      return (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input className="flex-1" placeholder="Heading text" value={get(d, "text")} onChange={(e) => onChange({ text: e.target.value })} />
          <select
            className="rounded-md border border-line bg-surface px-3 py-2 text-body"
            value={Number(d.level) === 3 ? "3" : "2"}
            onChange={(e) => onChange({ level: Number(e.target.value) })}
            aria-label="Heading level"
          >
            <option value="2">H2</option>
            <option value="3">H3</option>
          </select>
        </div>
      );
    case "paragraph":
      return <Textarea rows={4} placeholder="Write a paragraph…" value={get(d, "text")} onChange={(e) => onChange({ text: e.target.value })} />;
    case "quote":
      return (
        <div className="flex flex-col gap-2">
          <Textarea rows={3} placeholder="Quotation" value={get(d, "text")} onChange={(e) => onChange({ text: e.target.value })} />
          <Input placeholder="Attribution (optional)" value={get(d, "cite")} onChange={(e) => onChange({ cite: e.target.value })} />
        </div>
      );
    case "callout":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              className="rounded-md border border-line bg-surface px-3 py-2 text-body"
              value={get(d, "tone") || "info"}
              onChange={(e) => onChange({ tone: e.target.value })}
              aria-label="Callout tone"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="tip">Tip</option>
            </select>
            <Input className="flex-1" placeholder="Title (optional)" value={get(d, "title")} onChange={(e) => onChange({ title: e.target.value })} />
          </div>
          <Textarea rows={2} placeholder="Callout text" value={get(d, "text")} onChange={(e) => onChange({ text: e.target.value })} />
        </div>
      );
    case "code":
      return (
        <div className="flex flex-col gap-2">
          <Input placeholder="Language (optional)" value={get(d, "language")} onChange={(e) => onChange({ language: e.target.value })} />
          <Textarea rows={5} className="font-mono text-caption" placeholder="Code…" value={get(d, "code")} onChange={(e) => onChange({ code: e.target.value })} />
        </div>
      );
    case "list": {
      const items = (Array.isArray(d.items) ? d.items : []) as unknown[];
      return (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-caption text-soft">
            <input type="checkbox" checked={Boolean(d.ordered)} onChange={(e) => onChange({ ordered: e.target.checked })} className="size-4 accent-[var(--primary)]" />
            Numbered list
          </label>
          <Textarea
            rows={4}
            placeholder="One item per line"
            value={items.map((x) => (typeof x === "string" ? x : "")).join("\n")}
            onChange={(e) => onChange({ items: e.target.value.split("\n") })}
          />
        </div>
      );
    }
    case "checklist": {
      const items = (Array.isArray(d.items) ? d.items : []) as Record<string, unknown>[];
      const update = (next: Record<string, unknown>[]) => onChange({ items: next });
      return (
        <div className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(it.checked)}
                onChange={(e) => update(items.map((x, j) => (j === i ? { ...x, checked: e.target.checked } : x)))}
                className="size-4 accent-[var(--primary)]"
                aria-label="Done"
              />
              <Input
                className="flex-1"
                placeholder="Checklist item"
                value={get(it, "text")}
                onChange={(e) => update(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => update(items.filter((_, j) => j !== i))}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => update([...items, { text: "", checked: false }])}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
      );
    }
    case "table": {
      const headers = (Array.isArray(d.headers) ? d.headers : []) as unknown[];
      const rows = (Array.isArray(d.rows) ? d.rows : []) as unknown[][];
      return (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Column headers, comma-separated"
            value={headers.map((h) => (typeof h === "string" ? h : "")).join(", ")}
            onChange={(e) => onChange({ headers: e.target.value.split(",").map((s) => s.trim()) })}
          />
          <Textarea
            rows={4}
            placeholder="One row per line, cells separated by |"
            value={rows.map((r) => (Array.isArray(r) ? r.map((c) => (typeof c === "string" ? c : "")).join(" | ") : "")).join("\n")}
            onChange={(e) =>
              onChange({ rows: e.target.value.split("\n").map((line) => line.split("|").map((c) => c.trim())) })
            }
          />
        </div>
      );
    }
    case "stats": {
      const items = (Array.isArray(d.items) ? d.items : []) as Record<string, unknown>[];
      const update = (next: Record<string, unknown>[]) => onChange({ items: next });
      return (
        <div className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="w-28" placeholder="Value" value={get(it, "value")} onChange={(e) => update(items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <Input className="flex-1" placeholder="Label" value={get(it, "label")} onChange={(e) => update(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => update(items.filter((_, j) => j !== i))}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => update([...items, { label: "", value: "" }])}>
            <Plus className="size-4" /> Add statistic
          </Button>
        </div>
      );
    }
    case "columns":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Textarea rows={4} placeholder="Left column" value={get(d, "left")} onChange={(e) => onChange({ left: e.target.value })} />
          <Textarea rows={4} placeholder="Right column" value={get(d, "right")} onChange={(e) => onChange({ right: e.target.value })} />
        </div>
      );
    case "image":
      return <ImageBlockEditor data={d} onChange={onChange} />;
    case "gallery":
      return <GalleryBlockEditor data={d} onChange={onChange} />;
    case "video":
      return (
        <div className="flex flex-col gap-2">
          <Input placeholder="Video URL (YouTube, Vimeo, …)" value={get(d, "url")} onChange={(e) => onChange({ url: e.target.value })} />
          <Input placeholder="Caption (optional)" value={get(d, "caption")} onChange={(e) => onChange({ caption: e.target.value })} />
        </div>
      );
    case "media":
      return (
        <div className="flex flex-col gap-2">
          <Input placeholder="Embed URL (https://…)" value={get(d, "url")} onChange={(e) => onChange({ url: e.target.value })} />
          <Input placeholder="Caption (optional)" value={get(d, "caption")} onChange={(e) => onChange({ caption: e.target.value })} />
        </div>
      );
    case "button":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Button label" value={get(d, "label")} onChange={(e) => onChange({ label: e.target.value })} />
          <Input placeholder="Link (/path or https://…)" value={get(d, "href")} onChange={(e) => onChange({ href: e.target.value })} />
        </div>
      );
    case "divider":
      return <p className="text-caption text-soft">A horizontal divider will appear here.</p>;
    default:
      return null;
  }
}

/* -------------------------------- editor ---------------------------------- */
export function BlockEditor({
  initialBlocks,
  name = "blocks",
}: {
  initialBlocks: ArticleBlock[];
  name?: string;
}) {
  const [blocks, setBlocks] = React.useState<ArticleBlock[]>(
    initialBlocks.length > 0 ? initialBlocks : []
  );

  const update = (id: string, patch: Record<string, unknown>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)));
  const add = (type: BlockType) => {
    const def = getBlockDef(type);
    if (!def) return;
    setBlocks((bs) => [...bs, { id: newBlockId(), type, hidden: false, data: def.create() }]);
  };
  const duplicate = (id: string) =>
    setBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      if (idx < 0) return bs;
      const copy: ArticleBlock = { ...bs[idx], id: newBlockId(), data: { ...bs[idx].data } };
      return [...bs.slice(0, idx + 1), copy, ...bs.slice(idx + 1)];
    });
  const move = (id: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= bs.length) return bs;
      const copy = [...bs];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  const toggleHidden = (id: string) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)));
  const remove = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id));

  return (
    <div className="flex flex-col gap-sp-3">
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      {blocks.map((block, i) => {
        const def = getBlockDef(block.type);
        const Icon = def ? ICONS[def.icon] ?? Pilcrow : Pilcrow;
        return (
          <div
            key={block.id}
            className={cn(
              "rounded-lg border border-line bg-surface p-sp-3",
              block.hidden && "opacity-60"
            )}
          >
            <div className="mb-sp-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-caption font-heading font-bold uppercase tracking-wide text-soft">
                <Icon className="size-4" /> {def?.label ?? block.type}
                {block.hidden ? <span className="text-gold-700">(hidden)</span> : null}
              </span>
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(block.id, -1)}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => move(block.id, 1)}>
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Duplicate" onClick={() => duplicate(block.id)}>
                  <Copy className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={block.hidden ? "Show" : "Hide"} onClick={() => toggleHidden(block.id)}>
                  {block.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(block.id)}>
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            </div>
            <BlockBody block={block} onChange={(patch) => update(block.id, patch)} />
          </div>
        );
      })}

      {/* Add-block palette */}
      <div className="rounded-lg border border-dashed border-line-strong bg-background-subtle p-sp-3">
        <p className="mb-sp-2 text-caption font-heading font-bold uppercase tracking-wide text-soft">Add a block</p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_DEFS.map((def) => {
            const Icon = ICONS[def.icon] ?? Pilcrow;
            return (
              <Button key={def.type} type="button" variant="outline" size="sm" onClick={() => add(def.type)}>
                <Icon className="size-4" /> {def.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
