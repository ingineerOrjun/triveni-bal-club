"use client";

import * as React from "react";
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Link2, Eye, Pencil } from "lucide-react";
import { renderMarkdown, countWords } from "@/lib/cms/markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Lightweight, XSS-safe rich-text editor (Markdown). Toolbar inserts markdown,
 * with live preview, word/char counts. A full WYSIWYG (TipTap) is on the roadmap.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = React.useState(false);

  function surround(before: string, after = before) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    const selected = v.slice(s, e) || "text";
    const next = v.slice(0, s) + before + selected + after + v.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  function prefixLines(prefix: string) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, value: v } = ta;
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    onChange(v.slice(0, lineStart) + prefix + v.slice(lineStart));
  }

  const tools = [
    { icon: Bold, label: "Bold", run: () => surround("**") },
    { icon: Italic, label: "Italic", run: () => surround("*") },
    { icon: Heading2, label: "Heading", run: () => prefixLines("## ") },
    { icon: List, label: "Bullet list", run: () => prefixLines("- ") },
    { icon: ListOrdered, label: "Numbered list", run: () => prefixLines("1. ") },
    { icon: Quote, label: "Quote", run: () => prefixLines("> ") },
    { icon: Link2, label: "Link", run: () => surround("[", "](https://)") },
  ];

  return (
    <div className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-line p-1">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.run}
            aria-label={t.label}
            title={t.label}
            className="inline-flex size-8 items-center justify-center rounded text-soft hover:bg-background-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <t.icon className="size-4" />
          </button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
          {preview ? "Edit" : "Preview"}
        </Button>
      </div>

      {preview ? (
        <div
          className="min-h-32 p-sp-2 text-body text-ink [&_a]:text-primary-active [&_a]:underline [&_h2]:font-heading [&_h2]:text-h2 [&_li]:ml-sp-3 [&_li]:list-disc [&_p]:my-sp-1"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || "<p class='text-soft'>Nothing to preview.</p>" }}
        />
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className={cn(
            "w-full resize-y bg-transparent p-sp-2 text-body text-ink outline-none placeholder:text-soft"
          )}
          placeholder="Write with Markdown — **bold**, *italic*, ## heading, - list, [link](url)…"
        />
      )}

      <div className="flex justify-end gap-sp-2 border-t border-line px-sp-2 py-1 text-caption text-soft">
        <span>{countWords(value)} words</span>
        <span>·</span>
        <span>{value.length} chars</span>
      </div>
    </div>
  );
}
