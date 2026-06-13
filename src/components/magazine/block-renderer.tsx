import * as React from "react";
import Image from "next/image";
import { Info, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MagazineArticleBlockRow } from "@/types/database";

/* ----------------------------- safe accessors ----------------------------- */
function s(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}
function arr(data: Record<string, unknown>, key: string): unknown[] {
  const v = data[key];
  return Array.isArray(v) ? v : [];
}

/** Convert common video URLs to an embeddable form (YouTube / Vimeo). */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (u.protocol === "https:") return url;
    return null;
  } catch {
    return null;
  }
}

const CALLOUT_TONES: Record<string, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "border-primary/30 bg-primary-soft text-primary-active" },
  success: { icon: CheckCircle2, cls: "border-success/40 bg-success-bg text-emerald-700" },
  warning: { icon: AlertTriangle, cls: "border-warning/40 bg-warning-bg text-gold-700" },
  tip: { icon: Lightbulb, cls: "border-accent/30 bg-accent-soft text-accent-active" },
};

/** Paragraph text with preserved line breaks (rendered as text, never HTML). */
function RichText({ text }: { text: string }) {
  return <span className="whitespace-pre-wrap">{text}</span>;
}

function Block({ block }: { block: MagazineArticleBlockRow }) {
  if (block.hidden) return null;
  const d = block.data ?? {};
  switch (block.block_type) {
    case "heading": {
      const level = Number(d.level) === 3 ? 3 : 2;
      const text = s(d, "text");
      if (level === 3) return <h3 className="mt-sp-3 font-heading text-h3 font-bold text-ink">{text}</h3>;
      return <h2 className="mt-sp-4 font-heading text-h2 font-bold text-ink">{text}</h2>;
    }
    case "paragraph":
      return <p className="text-lead leading-relaxed text-ink"><RichText text={s(d, "text")} /></p>;
    case "quote":
      return (
        <blockquote className="border-l-4 border-accent pl-sp-3 text-lead italic text-ink">
          <RichText text={s(d, "text")} />
          {s(d, "cite") ? <cite className="mt-1 block text-caption not-italic text-soft">— {s(d, "cite")}</cite> : null}
        </blockquote>
      );
    case "divider":
      return <hr className="border-line-strong" />;
    case "code":
      return (
        <pre className="overflow-x-auto rounded-md border border-line bg-ink p-sp-3 text-caption text-slate-100">
          <code>{s(d, "code")}</code>
        </pre>
      );
    case "callout": {
      const tone = CALLOUT_TONES[s(d, "tone")] ?? CALLOUT_TONES.info;
      const Icon = tone.icon;
      return (
        <div className={cn("flex gap-3 rounded-md border p-sp-3", tone.cls)}>
          <Icon className="size-5 shrink-0" aria-hidden />
          <div>
            {s(d, "title") ? <p className="font-heading font-bold">{s(d, "title")}</p> : null}
            <p className="text-body text-ink"><RichText text={s(d, "text")} /></p>
          </div>
        </div>
      );
    }
    case "image": {
      const url = s(d, "url");
      if (!url) return null;
      return (
        <figure className="flex flex-col gap-1">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-line bg-background-subtle">
            <Image src={url} alt={s(d, "alt")} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
          </div>
          {s(d, "caption") ? <figcaption className="text-caption text-soft">{s(d, "caption")}</figcaption> : null}
        </figure>
      );
    }
    case "gallery": {
      const images = arr(d, "images").map((x) => x as Record<string, unknown>);
      if (images.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-sp-2 sm:grid-cols-3">
          {images.map((img, i) => {
            const url = s(img, "url");
            if (!url) return null;
            return (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-line bg-background-subtle">
                <Image src={url} alt={s(img, "alt")} fill sizes="(max-width: 768px) 33vw, 240px" className="object-cover" loading="lazy" />
              </div>
            );
          })}
        </div>
      );
    }
    case "video":
    case "media": {
      const url = s(d, "url");
      const embed = url ? toEmbedUrl(url) : null;
      if (!embed) return null;
      return (
        <figure className="flex flex-col gap-1">
          <div className="aspect-video overflow-hidden rounded-lg border border-line">
            <iframe
              src={embed}
              title={s(d, "caption") || "Embedded media"}
              className="size-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {s(d, "caption") ? <figcaption className="text-caption text-soft">{s(d, "caption")}</figcaption> : null}
        </figure>
      );
    }
    case "list": {
      const items = arr(d, "items").filter((x): x is string => typeof x === "string" && x.length > 0);
      if (items.length === 0) return null;
      const ordered = Boolean(d.ordered);
      const cls = "ml-5 flex flex-col gap-1 text-lead text-ink";
      return ordered ? (
        <ol className={cn(cls, "list-decimal")}>{items.map((it, i) => <li key={i}>{it}</li>)}</ol>
      ) : (
        <ul className={cn(cls, "list-disc")}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      );
    }
    case "checklist": {
      const items = arr(d, "items").map((x) => x as Record<string, unknown>);
      if (items.length === 0) return null;
      return (
        <ul className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-lead text-ink">
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded border",
                  it.checked ? "border-transparent bg-success-bg text-emerald-700" : "border-line-strong"
                )}
                aria-hidden
              >
                {it.checked ? <CheckCircle2 className="size-4" /> : null}
              </span>
              <span className={cn(Boolean(it.checked) && "text-soft line-through")}>{s(it, "text")}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "table": {
      const headers = arr(d, "headers").filter((x): x is string => typeof x === "string");
      const rows = arr(d, "rows").map((r) => (Array.isArray(r) ? r : [])) as unknown[][];
      if (headers.length === 0 && rows.length === 0) return null;
      return (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full border-collapse text-body">
            {headers.length > 0 ? (
              <thead>
                <tr className="bg-background-subtle">
                  {headers.map((h, i) => (
                    <th key={i} className="border-b border-line px-3 py-2 text-left font-heading font-bold text-ink">{h}</th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="even:bg-background-subtle/40">
                  {r.map((c, ci) => (
                    <td key={ci} className="border-b border-line px-3 py-2 text-ink">{typeof c === "string" ? c : ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "columns":
      return (
        <div className="grid gap-sp-3 sm:grid-cols-2">
          <p className="text-lead leading-relaxed text-ink"><RichText text={s(d, "left")} /></p>
          <p className="text-lead leading-relaxed text-ink"><RichText text={s(d, "right")} /></p>
        </div>
      );
    case "stats": {
      const items = arr(d, "items").map((x) => x as Record<string, unknown>);
      if (items.length === 0) return null;
      return (
        <div className="grid gap-sp-3 sm:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-sp-3 text-center">
              <p className="font-display text-display font-extrabold text-primary-active">{s(it, "value")}</p>
              <p className="text-caption font-semibold text-soft">{s(it, "label")}</p>
            </div>
          ))}
        </div>
      );
    }
    case "button": {
      const href = s(d, "href");
      const label = s(d, "label");
      if (!href || !label) return null;
      const safe = href.startsWith("/") || href.startsWith("https://");
      if (!safe) return null;
      return (
        <a
          href={href}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-heading font-bold text-on-primary hover:bg-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {label}
        </a>
      );
    }
    default:
      return null;
  }
}

/** Renders an ordered list of article blocks for public reading. */
export function BlockRenderer({ blocks }: { blocks: MagazineArticleBlockRow[] }) {
  const visible = blocks.filter((b) => !b.hidden);
  if (visible.length === 0) {
    return <p className="text-body text-soft">This article has no content yet.</p>;
  }
  return (
    <div className="flex flex-col gap-sp-3">
      {visible.map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </div>
  );
}
