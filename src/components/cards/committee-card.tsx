import type { CommitteeMember } from "@/content/types";
import { localize, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface CommitteeCardProps {
  member: CommitteeMember;
  locale?: Locale;
  /** Leadership/advisor get a more prominent treatment. */
  featured?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function CommitteeCard({
  member,
  locale = "en",
  featured = false,
}: CommitteeCardProps) {
  const name = localize(member.name, locale);
  const position = localize(member.position, locale);
  const bio = member.bio ? localize(member.bio, locale) : undefined;

  return (
    <Card className={cn("flex h-full flex-col items-center gap-sp-2 p-sp-3 text-center")}>
      <Avatar size={featured ? "xl" : "lg"}>
        {member.image ? (
          <AvatarImage src={member.image.src} alt={member.image.alt} />
        ) : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading text-h3 font-bold leading-tight text-ink">
          {name}
        </h3>
        <p className="font-heading text-body font-semibold text-primary-active">
          {position}
        </p>
        {member.classLevel ? (
          <p className="text-caption text-soft">{member.classLevel}</p>
        ) : null}
      </div>
      {bio && featured ? (
        <p className="text-body text-soft">{bio}</p>
      ) : null}
    </Card>
  );
}
