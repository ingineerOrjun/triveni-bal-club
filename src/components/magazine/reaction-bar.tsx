"use client";

import * as React from "react";
import { ThumbsUp, Heart, Sparkles, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { setReaction } from "@/lib/magazine/actions";
import type { MagazineReaction } from "@/types/database";

const REACTIONS: { key: MagazineReaction; label: string; icon: typeof Heart }[] = [
  { key: "like", label: "Like", icon: ThumbsUp },
  { key: "love", label: "Love", icon: Heart },
  { key: "inspiring", label: "Inspiring", icon: Sparkles },
  { key: "creative", label: "Creative", icon: Palette },
];

/** Pick one reaction per reader (click again to remove). */
export function ReactionBar({
  articleId,
  slug,
  initial,
  totalLikes,
  canReact,
}: {
  articleId: string;
  slug: string;
  initial: MagazineReaction | null;
  totalLikes: number;
  canReact: boolean;
}) {
  const [current, setCurrent] = React.useState<MagazineReaction | null>(initial);
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="React to this article">
      {REACTIONS.map(({ key, label, icon: Icon }) => {
        const active = current === key;
        return (
          <button
            key={key}
            type="button"
            disabled={pending || !canReact}
            aria-pressed={active}
            title={canReact ? label : "Sign in to react"}
            onClick={() => {
              setCurrent((c) => (c === key ? null : key));
              startTransition(async () => {
                await setReaction(articleId, slug, key);
              });
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption font-heading font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              active
                ? "border-transparent bg-primary text-on-primary"
                : "border-line bg-surface text-soft hover:text-ink"
            )}
          >
            <Icon className={cn("size-4", active && "fill-current")} />
            {label}
          </button>
        );
      })}
      <span className="ml-1 text-caption text-soft">{totalLikes} reaction{totalLikes === 1 ? "" : "s"}</span>
    </div>
  );
}
