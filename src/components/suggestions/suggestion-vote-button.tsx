"use client";

import { useFormStatus } from "react-dom";
import { ThumbsUp } from "lucide-react";
import { supportSuggestion, removeSupport } from "@/lib/suggestions/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Inner({
  supported,
  count,
}: {
  supported: boolean;
  count: number;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={supported ? "primary" : "outline"}
      size="sm"
      disabled={pending}
      aria-pressed={supported}
      aria-label={supported ? "Remove your support" : "Support this idea"}
      className={cn("gap-1.5")}
    >
      <ThumbsUp className={cn("size-4", supported && "fill-current")} />
      <span>{count}</span>
      <span className="hidden sm:inline">{supported ? "Supported" : "Support"}</span>
    </Button>
  );
}

/**
 * Toggle support for a suggestion. One support per member (enforced in the DB);
 * no downvotes. Bind nothing — the id is passed via the bound server action.
 */
export function SuggestionVoteButton({
  suggestionId,
  supported,
  count,
  disabled,
}: {
  suggestionId: string;
  supported: boolean;
  count: number;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <ThumbsUp className="size-4" />
        <span>{count}</span>
      </Button>
    );
  }
  const action = supported
    ? removeSupport.bind(null, suggestionId)
    : supportSuggestion.bind(null, suggestionId);
  return (
    <form action={action}>
      <Inner supported={supported} count={count} />
    </form>
  );
}
