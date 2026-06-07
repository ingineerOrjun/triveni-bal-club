import Link from "next/link";
import { Tag as TagIcon, UserRound, EyeOff } from "lucide-react";
import type { SuggestionListItem } from "@/lib/suggestions/queries";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuggestionStatusBadge } from "@/components/suggestions/suggestion-status-badge";
import { SuggestionVoteButton } from "@/components/suggestions/suggestion-vote-button";

export interface SuggestionCardProps {
  suggestion: SuggestionListItem;
  href: string;
  /** Staff may always see the real author, even for anonymous ideas. */
  isStaff?: boolean;
  /** The viewer's id — to label their own anonymous posts. */
  viewerId?: string;
  /** Show the support button. */
  canVote?: boolean;
}

export function SuggestionCard({
  suggestion,
  href,
  isStaff = false,
  viewerId,
  canVote = false,
}: SuggestionCardProps) {
  const isOwn = suggestion.author_id === viewerId;
  const showName = !suggestion.is_anonymous || isStaff || isOwn;
  const authorLabel = suggestion.is_anonymous
    ? isOwn
      ? "You (anonymous)"
      : isStaff
        ? `${suggestion.author?.full_name ?? "Member"} (anonymous)`
        : "Anonymous"
    : suggestion.author?.full_name ?? "Member";

  return (
    <Card className="flex h-full flex-col gap-2 p-sp-3">
      <div className="flex flex-wrap items-center gap-2">
        {suggestion.category ? (
          <Badge variant="soft">{suggestion.category.name}</Badge>
        ) : null}
        <SuggestionStatusBadge status={suggestion.status} />
      </div>

      <h3 className="font-heading text-h3 font-bold text-ink">
        <Link
          href={href}
          className="rounded-sm hover:text-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {suggestion.title}
        </Link>
      </h3>
      <p className="line-clamp-2 flex-1 text-body text-soft">
        {suggestion.description}
      </p>

      {suggestion.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {suggestion.tags.map((t) => (
            <li
              key={t.id}
              className="inline-flex items-center gap-1 rounded-pill bg-background-subtle px-2 py-0.5 text-caption text-soft"
            >
              <TagIcon className="size-3" /> {t.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-sp-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-caption text-soft">
          {showName ? (
            <UserRound className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
          {authorLabel} · {formatDate(suggestion.created_at)}
        </span>
        <SuggestionVoteButton
          suggestionId={suggestion.id}
          supported={suggestion.supported}
          count={suggestion.support_count}
          disabled={!canVote}
        />
      </div>
    </Card>
  );
}
