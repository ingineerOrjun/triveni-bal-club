"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type {
  MagazineCategoryRow,
  MagazineEditionRow,
} from "@/types/database";
import type { ArticleDetail } from "@/lib/magazine/queries";
import type { ArticleBlock, BlockType } from "@/lib/magazine/blocks";
import { saveArticle } from "@/lib/magazine/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/shared/field-error";
import { MediaField } from "@/components/media/media-field";
import { BlockEditor } from "./block-editor";

function toBlocks(detail: ArticleDetail): ArticleBlock[] {
  return detail.blocks.map((b) => ({
    id: b.id,
    type: b.block_type as BlockType,
    hidden: b.hidden,
    data: b.data ?? {},
  }));
}

function SaveButtons({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface/95 p-sp-2 shadow-md backdrop-blur">
      <Button type="submit" name="intent" value="save" variant="primary" disabled={pending}>
        <Save className="size-4" /> {pending ? "Saving…" : "Save"}
      </Button>
      {canSubmit ? (
        <Button type="submit" name="intent" value="submit" variant="accent" disabled={pending}>
          <Send className="size-4" /> Save &amp; submit for review
        </Button>
      ) : null}
      <span className="text-caption text-soft">Every save creates a version snapshot.</span>
    </div>
  );
}

/** Full article authoring surface: metadata + cover + block content. */
export function ArticleEditor({
  article,
  categories,
  editions,
  scope,
}: {
  article: ArticleDetail;
  categories: MagazineCategoryRow[];
  editions: MagazineEditionRow[];
  scope: "portal" | "admin";
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveArticle.bind(null, article.id),
    {}
  );
  const canSubmit = scope === "portal" && (article.status === "draft" || article.status === "revision_required");

  return (
    <form action={formAction} className="flex flex-col gap-sp-4" noValidate>
      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}
      {state.message ? (
        <div role="status" className="flex items-center gap-2 rounded-md border border-success/40 bg-success-bg/50 px-3 py-2 text-caption text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {state.message}
        </div>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Article details</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-sp-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={article.title} aria-invalid={Boolean(state.fieldErrors?.title)} required />
            <FieldError id="title" message={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={article.excerpt ?? ""} placeholder="A short summary (auto-generated if left blank)" />
          </div>

          <div className="grid gap-sp-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category_id">Category</Label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={article.category_id ?? ""}
                className="rounded-md border border-line bg-surface px-3 py-2 text-body"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edition_id">Edition</Label>
              <select
                id="edition_id"
                name="edition_id"
                defaultValue={article.edition_id ?? ""}
                className="rounded-md border border-line bg-surface px-3 py-2 text-body"
              >
                <option value="">Unassigned</option>
                {editions.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          <MediaField name="cover_image" label="Cover image" defaultValue={article.cover_image ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent>
          <BlockEditor initialBlocks={toBlocks(article)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-sp-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seo_title">SEO title</Label>
            <Input id="seo_title" name="seo_title" defaultValue={article.seo_title ?? ""} placeholder="Defaults to the article title" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seo_description">SEO description</Label>
            <Textarea id="seo_description" name="seo_description" rows={2} defaultValue={article.seo_description ?? ""} placeholder="Defaults to the excerpt" />
          </div>
        </CardContent>
      </Card>

      <SaveButtons canSubmit={canSubmit} />
    </form>
  );
}
