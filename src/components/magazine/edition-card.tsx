import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { MagazineEditionRow } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function editionLabel(edition: Pick<MagazineEditionRow, "volume" | "issue_number">): string {
  const parts: string[] = [];
  if (edition.volume != null) parts.push(`Vol. ${edition.volume}`);
  if (edition.issue_number != null) parts.push(`Issue ${edition.issue_number}`);
  return parts.join(" · ");
}

/** Edition cover card linking to the edition page. */
export function EditionCard({ edition }: { edition: MagazineEditionRow }) {
  const label = editionLabel(edition);
  return (
    <Card className="group overflow-hidden">
      <Link
        href={`/magazine/${edition.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-background-subtle">
          {edition.cover_image ? (
            <Image
              src={edition.cover_image}
              alt={edition.title}
              fill
              sizes="(max-width: 768px) 50vw, 220px"
              className="object-cover transition-transform duration-base group-hover:scale-105"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-soft"><BookOpen className="size-10" /></span>
          )}
        </div>
        <div className="flex flex-col gap-1 p-sp-3">
          {label ? <Badge variant="soft" className="w-fit">{label}</Badge> : null}
          <h3 className="font-heading text-h3 font-bold text-ink group-hover:text-primary-active">{edition.title}</h3>
          {edition.published_at ? (
            <p className="text-caption text-soft">{formatDate(edition.published_at)}</p>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}
