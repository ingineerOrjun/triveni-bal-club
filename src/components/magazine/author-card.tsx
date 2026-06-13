import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MemberRef } from "@/lib/magazine/queries";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

/** Byline / author profile block shown on article pages. Links to the public
 *  contributor profile when `href` is provided. */
export function AuthorCard({
  author,
  role = "Author",
  subtitle,
  href,
}: {
  author: MemberRef | null;
  role?: string;
  subtitle?: string;
  href?: string;
}) {
  const name = author?.full_name ?? "Club member";
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar size="md">
        {author?.avatar_url ? <AvatarImage src={author.avatar_url} alt="" /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-left">
        <p className="inline-flex items-center gap-1 truncate font-heading text-body font-bold text-ink">
          {name}
          {href ? <ArrowUpRight className="size-3.5 text-soft" aria-hidden /> : null}
        </p>
        <p className="truncate text-caption text-soft">{subtitle ?? role}</p>
      </div>
    </div>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  );
}
