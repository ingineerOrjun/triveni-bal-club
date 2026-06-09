"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Save,
  Send,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  ImagePlus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  BLOCK_TYPES,
  blockDefaults,
  getBlockType,
  type Block,
  type FieldDef,
} from "@/lib/cms/blocks";
import { savePageContent, publishPage } from "@/lib/cms/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RichTextEditor } from "@/components/cms/rich-text-editor";
import { MediaPicker } from "@/components/media/media-picker";

type Props = Record<string, unknown>;

export function PageBuilder({
  pageId,
  slug,
  status,
  initialTitle,
  initialBlocks,
  initialSeo,
  canCustomHtml,
}: {
  pageId: string;
  slug: string;
  status: string;
  initialTitle: string;
  initialBlocks: Block[];
  initialSeo: Props;
  canCustomHtml: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [blocks, setBlocks] = React.useState<Block[]>(initialBlocks);
  const [seo, setSeo] = React.useState<Props>(initialSeo);
  const [busy, setBusy] = React.useState<"save" | "publish" | null>(null);
  const [saved, setSaved] = React.useState(false);

  function update(id: string, patch: Partial<Block>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function setProp(id: string, key: string, value: unknown) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b)));
  }
  function addBlock(type: string) {
    setBlocks((bs) => [...bs, { id: crypto.randomUUID(), type, enabled: true, props: blockDefaults(type) }]);
  }
  function move(id: string, dir: -1 | 1) {
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function remove(id: string) {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }

  async function save() {
    setBusy("save");
    try {
      await savePageContent(pageId, { title, blocks, seo });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setBusy(null);
    }
  }
  async function doPublish() {
    setBusy("publish");
    try {
      await savePageContent(pageId, { title, blocks, seo });
      await publishPage(pageId);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const available = BLOCK_TYPES.filter((b) => canCustomHtml || !b.adminOnly);

  return (
    <div className="flex flex-col gap-sp-4">
      {/* Toolbar */}
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-sp-2 rounded-md border border-line bg-surface p-sp-2 shadow-md">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Page title" className="max-w-xs" />
        <Badge variant={status === "published" ? "success" : status === "scheduled" ? "warning" : "neutral"} className="capitalize">
          {status}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          {saved ? (
            <span className="inline-flex items-center gap-1 text-caption text-emerald-700">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <a href={`/pages/${slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Preview
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={save} disabled={busy !== null}>
            {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          </Button>
          <Button variant="primary" size="sm" onClick={doPublish} disabled={busy !== null}>
            {busy === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publish
          </Button>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-sp-3">
        {blocks.length === 0 ? (
          <p className="rounded-md border border-dashed border-line-strong bg-surface-2 p-sp-4 text-center text-body text-soft">
            No sections yet. Add one below.
          </p>
        ) : (
          blocks.map((block, i) => {
            const meta = getBlockType(block.type);
            return (
              <Card key={block.id} className={cn(!block.enabled && "opacity-60")}>
                <div className="flex items-center justify-between gap-2 border-b border-line p-sp-2">
                  <span className="font-heading font-bold text-ink">{meta?.label ?? block.type}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Move up" onClick={() => move(block.id, -1)} disabled={i === 0}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Move down" onClick={() => move(block.id, 1)} disabled={i === blocks.length - 1}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={block.enabled ? "Disable section" : "Enable section"}
                      onClick={() => update(block.id, { enabled: !block.enabled })}
                    >
                      {block.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Remove section" onClick={() => remove(block.id)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </div>
                <CardContent className="flex flex-col gap-sp-3 p-sp-3">
                  {(meta?.fields ?? []).map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      value={block.props[field.key]}
                      onChange={(v) => setProp(block.id, field.key, v)}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add block */}
      <Card>
        <CardContent className="p-sp-3">
          <p className="mb-sp-2 font-heading font-bold text-ink">Add a section</p>
          <div className="flex flex-wrap gap-2">
            {available.map((b) => (
              <Button key={b.type} variant="outline" size="sm" onClick={() => addBlock(b.type)}>
                <Plus className="size-4" /> {b.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardContent className="flex flex-col gap-sp-3 p-sp-4">
          <p className="font-heading text-h3 font-bold text-ink">SEO</p>
          <div className="grid gap-sp-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seo-title">Meta title</Label>
              <Input id="seo-title" value={String(seo.title ?? "")} onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seo-canonical">Canonical URL</Label>
              <Input id="seo-canonical" value={String(seo.canonical ?? "")} onChange={(e) => setSeo((s) => ({ ...s, canonical: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seo-desc">Meta description</Label>
            <Textarea id="seo-desc" rows={2} value={String(seo.description ?? "")} onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))} />
          </div>
          <ImageField label="Social image" value={String(seo.ogImage ?? "")} onChange={(v) => setSeo((s) => ({ ...s, ogImage: v }))} />
          <label className="flex items-center gap-2 text-body text-ink">
            <input type="checkbox" checked={Boolean(seo.noindex)} onChange={(e) => setSeo((s) => ({ ...s, noindex: e.target.checked }))} className="size-5 rounded accent-[var(--primary)]" />
            Hide from search engines (noindex)
          </label>
        </CardContent>
      </Card>
    </div>
  );
}

/* --------------------------- field editors -------------------------------- */
function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "richtext")
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{field.label}</Label>
        <RichTextEditor value={String(value ?? "")} onChange={onChange} />
      </div>
    );
  if (field.type === "image")
    return <ImageField label={field.label} value={String(value ?? "")} onChange={onChange} />;
  if (field.type === "boolean")
    return (
      <label className="flex items-center gap-2 text-body text-ink">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="size-5 rounded accent-[var(--primary)]" />
        {field.label}
      </label>
    );
  if (field.type === "select")
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{field.label}</Label>
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-md border border-line bg-surface px-2 text-body text-ink"
        >
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  if (field.type === "textarea")
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{field.label}</Label>
        <Textarea rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      </div>
    );
  if (field.type === "number")
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{field.label}</Label>
        <Input type="number" value={String(value ?? "")} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  if (field.type === "list")
    return <RepeaterField field={field} value={Array.isArray(value) ? (value as Props[]) : []} onChange={onChange} />;
  // text
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{field.label}</Label>
      <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      {field.help ? <p className="text-caption text-soft">{field.help}</p> : null}
    </div>
  );
}

function RepeaterField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: Props[];
  onChange: (v: unknown) => void;
}) {
  const itemFields = field.itemFields ?? [];
  function setItem(i: number, key: string, v: unknown) {
    onChange(value.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  }
  return (
    <div className="flex flex-col gap-sp-2">
      <Label>{field.label}</Label>
      {value.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border border-line bg-surface-2 p-sp-2">
          {itemFields.map((sub) => (
            <div key={sub.key} className="flex flex-col gap-1">
              <Label className="text-caption">{sub.label}</Label>
              {sub.type === "textarea" ? (
                <Textarea rows={2} value={String(item[sub.key] ?? "")} onChange={(e) => setItem(i, sub.key, e.target.value)} />
              ) : (
                <Input value={String(item[sub.key] ?? "")} onChange={(e) => setItem(i, sub.key, e.target.value)} />
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
            <Trash2 className="size-4 text-danger" /> Remove
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...value, Object.fromEntries(itemFields.map((f) => [f.key, ""]))])
        }
      >
        <Plus className="size-4" /> Add item
      </Button>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-sp-2">
        <div className="size-16 shrink-0 overflow-hidden rounded-md border border-line bg-background-subtle">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-soft">
              <ImagePlus className="size-5" />
            </span>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ImagePlus className="size-4" /> {value ? "Change" : "Choose"}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        ) : null}
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} onSelect={(f) => onChange(f.public_url ?? f.thumbnail_url ?? "")} />
    </div>
  );
}
