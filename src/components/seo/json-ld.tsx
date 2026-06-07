import { SITE, CONTACT } from "@/content/site";

/**
 * Renders a JSON-LD <script>. Next.js allows this in the App Router; we
 * stringify a plain object. Keep payloads small and accurate.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** EducationalOrganization schema for the club (use on the homepage). */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE.name,
    alternateName: SITE.nameNe,
    description: SITE.description.en,
    url: SITE.url,
    parentOrganization: {
      "@type": "EducationalOrganization",
      name: SITE.school,
    },
    email: CONTACT.email,
    telephone: CONTACT.phone,
    foundingDate: String(SITE.founded),
    address: {
      "@type": "PostalAddress",
      addressCountry: "NP",
      streetAddress: CONTACT.address.en,
    },
  };
}

/** BreadcrumbList schema from an ordered list of {name, url}. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/** Event schema (use on event detail / events list). */
export function eventJsonLd(e: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    description: e.description,
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.location,
      address: { "@type": "PostalAddress", addressCountry: "NP" },
    },
    organizer: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
