"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Vote, Loader2, AlertCircle } from "lucide-react";
import type { PositionWithCandidates } from "@/lib/elections/queries";
import { castVote } from "@/lib/elections/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoteReceipt } from "@/components/elections/vote-receipt";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function VotingBooth({
  electionId,
  positions,
}: {
  electionId: string;
  positions: PositionWithCandidates[];
}) {
  const router = useRouter();
  const [picks, setPicks] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [receipt, setReceipt] = React.useState<string | null>(null);

  if (receipt) return <VoteReceipt code={receipt} />;

  const selectedCount = Object.values(picks).filter(Boolean).length;

  async function submit() {
    setError(null);
    if (selectedCount === 0) {
      setError("Select at least one candidate before submitting.");
      return;
    }
    setBusy(true);
    try {
      const choices = Object.entries(picks)
        .filter(([, cand]) => cand)
        .map(([position_id, candidate_id]) => ({ position_id, candidate_id }));
      const res = await castVote(electionId, choices);
      if (!res.ok) setError(res.error ?? "Could not record your vote.");
      else {
        setReceipt(res.code ?? "RECORDED");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-sp-4">
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      ) : null}

      {positions.map((position) => (
        <Card key={position.id} className="p-sp-3">
          <div className="mb-sp-2 flex items-center justify-between gap-2">
            <h3 className="font-heading text-h3 font-bold text-ink">{position.title}</h3>
            <button
              type="button"
              onClick={() => setPicks((p) => ({ ...p, [position.id]: "" }))}
              className="rounded-sm text-caption font-semibold text-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Abstain
            </button>
          </div>
          {position.candidates.length === 0 ? (
            <p className="text-body text-soft">No candidates for this position.</p>
          ) : (
            <div role="radiogroup" aria-label={`Candidates for ${position.title}`} className="grid gap-sp-2 sm:grid-cols-2">
              {position.candidates.map((c) => {
                const checked = picks[position.id] === c.id;
                const name = c.memberName ?? "Candidate";
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setPicks((p) => ({ ...p, [position.id]: c.id }))}
                    className={cn(
                      "flex items-center gap-sp-2 rounded-lg border p-sp-2 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      checked ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-line-strong"
                    )}
                  >
                    <Avatar size="md">
                      {c.photo_url ? <AvatarImage src={c.photo_url} alt="" /> : null}
                      <AvatarFallback>{initials(name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block font-heading font-bold text-ink">{name}</span>
                      {c.slogan ? <span className="block text-caption text-primary-active">“{c.slogan}”</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      ))}

      <div className="flex items-center gap-sp-2">
        <Button variant="primary" size="lg" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Vote className="size-4" />}
          Submit ballot
        </Button>
        <span className="text-caption text-soft">
          {selectedCount} of {positions.length} selected · your ballot is secret
        </span>
      </div>
    </div>
  );
}
