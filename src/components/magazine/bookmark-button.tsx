"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleBookmark } from "@/lib/magazine/actions";
import { Button } from "@/components/ui/button";

/** Save/unsave an article. Optimistic, with a server round-trip. */
export function BookmarkButton({
  articleId,
  slug,
  initialBookmarked,
  canBookmark,
}: {
  articleId: string;
  slug: string;
  initialBookmarked: boolean;
  canBookmark: boolean;
}) {
  const [saved, setSaved] = React.useState(initialBookmarked);
  const [pending, startTransition] = React.useTransition();

  if (!canBookmark) {
    return (
      <Button asChild variant="outline" size="sm">
        <a href="/auth/login">
          <Bookmark className="size-4" /> Save
        </a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "primary" : "outline"}
      size="sm"
      disabled={pending}
      aria-pressed={saved}
      onClick={() => {
        setSaved((v) => !v);
        startTransition(async () => {
          await toggleBookmark(articleId, slug);
        });
      }}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
