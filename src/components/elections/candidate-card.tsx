import { UserRound } from "lucide-react";
import type { CandidateView } from "@/lib/elections/queries";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function CandidateCard({
  candidate,
  selected,
}: {
  candidate: CandidateView;
  selected?: boolean;
}) {
  const name = candidate.memberName ?? "Candidate";
  return (
    <Card className={selected ? "border-primary ring-2 ring-primary p-sp-3" : "p-sp-3"}>
      <div className="flex items-center gap-sp-2">
        <Avatar size="lg">
          {candidate.photo_url ? <AvatarImage src={candidate.photo_url} alt="" /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 font-heading text-h3 font-bold text-ink">
            <UserRound className="size-4 text-soft" /> {name}
          </p>
          {candidate.slogan ? (
            <p className="text-body text-primary-active">“{candidate.slogan}”</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
