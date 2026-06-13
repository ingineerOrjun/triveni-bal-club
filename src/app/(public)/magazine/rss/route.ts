import { SITE } from "@/content/site";
import { listPublishedArticles } from "@/lib/magazine/queries";

export const dynamic = "force-dynamic";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 feed for the magazine (PART 13). */
export async function GET(): Promise<Response> {
  const articles = await listPublishedArticles({ limit: 30 });
  const items = articles
    .map((a) => {
      const link = `${SITE.url}/magazine/article/${a.slug}`;
      const date = a.published_at ? new Date(a.published_at).toUTCString() : new Date(a.created_at).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(a.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        a.authorName ? `      <dc:creator>${escapeXml(a.authorName)}</dc:creator>` : "",
        a.categoryName ? `      <category>${escapeXml(a.categoryName)}</category>` : "",
        `      <pubDate>${date}</pubDate>`,
        a.excerpt ? `      <description>${escapeXml(a.excerpt)}</description>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${SITE.name} — Magazine`)}</title>
    <link>${SITE.url}/magazine</link>
    <description>Triveni Voices — the student magazine.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
