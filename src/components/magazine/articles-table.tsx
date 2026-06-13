"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Star, StarOff, Send, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { MagazineCategoryRow, MagazineEditionRow } from "@/types/database";
import type { ArticleListItem } from "@/lib/magazine/queries";
import { publishArticle, archiveArticle, setFeatured } from "@/lib/magazine/actions";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ArticleStatusBadge } from "./magazine-badges";
import { CategoryChip } from "./category-chip";
import { ArticleBulkBar } from "./admin-forms";

function IconAction({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-button text-soft transition-colors",
        "hover:bg-background-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        danger && "hover:text-danger"
      )}
    >
      {children}
    </button>
  );
}

/** Inline per-row quick actions — act without opening the article. */
function RowActions({ article }: { article: ArticleListItem }) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const run = (message: string, fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      toast({ title: message, description: article.title, variant: "success" });
    });

  return (
    <div className="flex items-center justify-end gap-0.5">
      {article.status !== "published" ? (
        <IconAction title="Publish now" disabled={pending} onClick={() => run("Published", () => publishArticle(article.id))}>
          <Send className="size-4" />
        </IconAction>
      ) : null}
      <IconAction
        title={article.featured ? "Unfeature" : "Feature"}
        disabled={pending}
        onClick={() => run(article.featured ? "Unfeatured" : "Featured", () => setFeatured(article.id, !article.featured))}
      >
        {article.featured ? <StarOff className="size-4" /> : <Star className="size-4" />}
      </IconAction>
      {article.status !== "archived" ? (
        <IconAction title="Archive" disabled={pending} onClick={() => run("Archived", () => archiveArticle(article.id))}>
          <Archive className="size-4" />
        </IconAction>
      ) : null}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/magazine/articles/${article.id}`}><Pencil className="size-4" /> Edit</Link>
      </Button>
    </div>
  );
}

/** Admin article table with selection + bulk actions (client island). */
export function ArticlesTable({
  rows,
  categories,
  editions,
}: {
  rows: ArticleListItem[];
  categories: MagazineCategoryRow[];
  editions: MagazineEditionRow[];
}) {
  const columns: Column<ArticleListItem>[] = [
    {
      key: "title",
      header: "Title",
      render: (a) => (
        <div className="flex items-center gap-1.5">
          {a.featured ? <Star className="size-3.5 shrink-0 fill-current text-accent-active" aria-label="Featured" /> : null}
          <Link href={`/admin/magazine/articles/${a.id}`} className="font-semibold text-ink hover:text-primary-active">
            {a.title}
          </Link>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (a) => <ArticleStatusBadge status={a.status} /> },
    {
      key: "category",
      header: "Category",
      render: (a) => (a.categoryName ? <CategoryChip name={a.categoryName} color={a.categoryColor} /> : <span className="text-soft">—</span>),
    },
    { key: "author", header: "Author", render: (a) => <span className="text-soft">{a.authorName ?? "—"}</span> },
    { key: "views", header: "Views", align: "right", render: (a) => <span className="tabular-nums">{a.views}</span> },
    {
      key: "updated",
      header: "Updated",
      render: (a) => <span className="text-caption text-soft">{formatDate(a.updated_at ?? a.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => <RowActions article={a} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      selectable
      renderBulkBar={(ids, clear) => (
        <ArticleBulkBar ids={ids} clear={clear} categories={categories} editions={editions} />
      )}
      emptyTitle="No articles found"
      emptyDescription="Adjust your filters or create a new article."
    />
  );
}
