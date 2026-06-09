import Link from "next/link";
import { CalendarDays, Quote as QuoteIcon } from "lucide-react";
import type { Block } from "@/lib/cms/blocks";
import { renderMarkdown } from "@/lib/cms/markdown";
import { listEvents } from "@/lib/events/queries";
import { COMMITTEE } from "@/content/committee";
import { localize } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { CTASection } from "@/components/sections/cta-section";

type Props = Record<string, unknown>;
const str = (p: Props, k: string) => (p[k] == null ? "" : String(p[k]));
const num = (p: Props, k: string, d = 0) => {
  const n = Number(p[k]);
  return Number.isFinite(n) ? n : d;
};
const list = (p: Props, k: string): Props[] =>
  Array.isArray(p[k]) ? (p[k] as Props[]) : [];

const SPACER = { sm: "h-sp-3", md: "h-sp-5", lg: "h-sp-6" } as const;

/** Renders an ordered array of CMS blocks into the page. Server component. */
export async function PageRenderer({ blocks }: { blocks: Block[] }) {
  const active = blocks.filter((b) => b && b.enabled !== false);
  const needsEvents = active.some((b) => b.type === "widgetEvents");
  const events = needsEvents ? await listEvents() : [];
  const now = Date.now();
  const upcoming = events
    .filter((e) => e.status === "published" && new Date(e.starts_at).getTime() >= now)
    .slice(0, 6);

  return (
    <>
      {active.map((block) => {
        const p = block.props ?? {};
        switch (block.type) {
          case "hero":
            return (
              <HeroSection
                key={block.id}
                title={str(p, "title")}
                description={str(p, "subtitle") || undefined}
                image={str(p, "image") ? { src: str(p, "image"), alt: str(p, "title") } : undefined}
                actions={
                  str(p, "ctaLabel") ? (
                    <Link
                      href={str(p, "ctaHref") || "/"}
                      className="inline-flex h-13 items-center rounded-lg bg-primary px-7 font-heading text-lead font-semibold text-on-primary"
                    >
                      {str(p, "ctaLabel")}
                    </Link>
                  ) : undefined
                }
              />
            );

          case "heading":
            return (
              <section key={block.id} className="container-page py-sp-3">
                <SectionHeader eyebrow={str(p, "eyebrow") || undefined} title={str(p, "text")} />
              </section>
            );

          case "richtext":
            return (
              <section key={block.id} className="container-page py-sp-4">
                <div
                  className="mx-auto max-w-prose text-body text-ink [&_a]:text-primary-active [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-line [&_blockquote]:pl-sp-2 [&_blockquote]:text-soft [&_h2]:mt-sp-3 [&_h2]:font-heading [&_h2]:text-h2 [&_h2]:font-bold [&_h3]:mt-sp-2 [&_h3]:font-heading [&_h3]:text-h3 [&_h3]:font-bold [&_li]:ml-sp-3 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:my-sp-2"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(str(p, "content")) }}
                />
              </section>
            );

          case "image":
            return (
              <section key={block.id} className="container-page py-sp-4">
                <figure className="mx-auto max-w-3xl">
                  {str(p, "url") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={str(p, "url")}
                      alt={str(p, "alt")}
                      loading="lazy"
                      className="w-full rounded-lg border border-line"
                    />
                  ) : null}
                  {str(p, "caption") ? (
                    <figcaption className="mt-sp-1 text-center text-caption text-soft">
                      {str(p, "caption")}
                    </figcaption>
                  ) : null}
                </figure>
              </section>
            );

          case "statistics":
            return (
              <section key={block.id} className="container-page py-sp-5">
                <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
                  {list(p, "items").map((it, i) => (
                    <div key={i} className="text-center">
                      <p className="font-display text-display font-extrabold text-primary-active">
                        {str(it, "value")}
                      </p>
                      <p className="text-body text-soft">{str(it, "label")}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "cardGrid":
            return (
              <section key={block.id} className="container-page py-sp-4">
                <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list(p, "items").map((it, i) => {
                    const inner = (
                      <Card interactive={Boolean(str(it, "href"))} className="h-full">
                        <CardContent className="p-sp-3">
                          <h3 className="font-heading text-h3 font-bold text-ink">{str(it, "title")}</h3>
                          <p className="mt-1 text-body text-soft">{str(it, "body")}</p>
                        </CardContent>
                      </Card>
                    );
                    return str(it, "href") ? (
                      <Link key={i} href={str(it, "href")} className="block">{inner}</Link>
                    ) : (
                      <div key={i}>{inner}</div>
                    );
                  })}
                </div>
              </section>
            );

          case "cta":
            return (
              <CTASection
                key={block.id}
                title={str(p, "title")}
                description={str(p, "description") || undefined}
                primary={str(p, "primaryLabel") ? { label: str(p, "primaryLabel"), href: str(p, "primaryHref") || "/" } : undefined}
                secondary={str(p, "secondaryLabel") ? { label: str(p, "secondaryLabel"), href: str(p, "secondaryHref") || "/" } : undefined}
              />
            );

          case "quote":
            return (
              <section key={block.id} className="container-page py-sp-4">
                <blockquote className="mx-auto max-w-2xl text-center">
                  <QuoteIcon className="mx-auto size-8 text-accent" aria-hidden />
                  <p className="mt-sp-2 text-lead text-ink">“{str(p, "text")}”</p>
                  {str(p, "author") ? (
                    <footer className="mt-sp-2 font-heading font-bold text-soft">— {str(p, "author")}</footer>
                  ) : null}
                </blockquote>
              </section>
            );

          case "divider":
            return (
              <div key={block.id} className="container-page">
                <hr className="border-line" />
              </div>
            );

          case "spacer":
            return <div key={block.id} className={SPACER[(str(p, "size") as keyof typeof SPACER) || "md"]} />;

          case "widgetEvents":
            return (
              <section key={block.id} className="container-page py-sp-5">
                <SectionHeader title={str(p, "heading") || "Upcoming events"} className="mb-sp-4" />
                <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.slice(0, num(p, "limit", 3)).map((e) => (
                    <Card key={e.id} className="p-sp-3">
                      <h3 className="font-heading text-h3 font-bold text-ink">{e.title}</h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-caption text-soft">
                        <CalendarDays className="size-4" /> {formatDateTime(e.starts_at)}
                      </p>
                    </Card>
                  ))}
                  {upcoming.length === 0 ? (
                    <p className="text-body text-soft">No upcoming events.</p>
                  ) : null}
                </div>
              </section>
            );

          case "widgetCommittee":
            return (
              <section key={block.id} className="container-page py-sp-5">
                <SectionHeader title={str(p, "heading") || "Our committee"} className="mb-sp-4" />
                <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
                  {COMMITTEE.filter((m) => m.kind === "leadership").map((m) => (
                    <Card key={m.id} className="p-sp-3 text-center">
                      <p className="font-heading font-bold text-ink">{localize(m.name)}</p>
                      <p className="text-caption text-primary-active">{localize(m.position)}</p>
                    </Card>
                  ))}
                </div>
              </section>
            );

          case "customHtml":
            // Admin-authored; rendered as-is. (Treated as trusted admin content.)
            return (
              <section
                key={block.id}
                className="container-page py-sp-4"
                dangerouslySetInnerHTML={{ __html: str(p, "html") }}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}
