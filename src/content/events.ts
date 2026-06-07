import type { ClubEvent } from "./types";

/**
 * Reference "now" for splitting upcoming/past. Kept as a constant so static
 * builds are deterministic; later this becomes the request time / DB `now()`.
 */
export const REFERENCE_NOW = "2026-06-05T00:00:00+05:45";

/**
 * Events. "Upcoming" vs "past" is derived by comparing `startsAt` to a
 * reference date passed in by the caller (so rendering stays deterministic).
 */
export const EVENTS: ClubEvent[] = [
  {
    slug: "annual-general-meeting-2026",
    title: { en: "Annual General Meeting", ne: "वार्षिक साधारण सभा" },
    description: {
      en: "Club-wide meeting to review the year, share plans, and welcome new members.",
      ne: "वर्षको समीक्षा, योजना साझेदारी र नयाँ सदस्य स्वागतका लागि क्लबव्यापी सभा।",
    },
    location: { en: "School Assembly Hall", ne: "विद्यालय सभा हल" },
    startsAt: "2026-07-15T10:00:00+05:45",
    endsAt: "2026-07-15T12:00:00+05:45",
    image: { src: "/gallery/triveni-05.jpeg", alt: "Students gathered in the assembly hall" },
    registrationRequired: false,
  },
  {
    slug: "club-elections-2026",
    title: { en: "Club Committee Elections", ne: "क्लब समिति निर्वाचन" },
    description: {
      en: "Students vote to elect the next club committee in a transparent, secret ballot.",
      ne: "विद्यार्थीहरूले पारदर्शी गोप्य मतदानमार्फत अर्को क्लब समिति चुन्छन्।",
    },
    location: { en: "School Library", ne: "विद्यालय पुस्तकालय" },
    startsAt: "2026-08-09T09:00:00+05:45",
    endsAt: "2026-08-09T14:00:00+05:45",
    image: { src: "/gallery/triveni-14.jpeg", alt: "Students at the elections" },
    registrationRequired: true,
  },
  {
    slug: "science-innovation-fair-2026",
    title: { en: "Science & Innovation Fair", ne: "विज्ञान तथा नवप्रवर्तन मेला" },
    description: {
      en: "Students present projects and experiments to judges, families, and visitors.",
      ne: "विद्यार्थीहरूले निर्णायक, परिवार र आगन्तुकहरूसामु परियोजना प्रस्तुत गर्छन्।",
    },
    location: { en: "School Courtyard", ne: "विद्यालय प्राङ्गण" },
    startsAt: "2026-09-20T10:00:00+05:45",
    endsAt: "2026-09-20T15:00:00+05:45",
    image: { src: "/gallery/triveni-25.jpeg", alt: "Science fair projects on display" },
    registrationRequired: true,
  },
  {
    slug: "annual-art-exhibition-2025",
    title: { en: "Annual Art Exhibition", ne: "वार्षिक कला प्रदर्शनी" },
    description: {
      en: "A celebration of student creativity across painting, craft, and design.",
      ne: "चित्रकला, हस्तकला र डिजाइनमा विद्यार्थी सिर्जनशीलताको उत्सव।",
    },
    location: { en: "School Hall", ne: "विद्यालय हल" },
    startsAt: "2025-12-05T11:00:00+05:45",
    endsAt: "2025-12-05T16:00:00+05:45",
    image: { src: "/gallery/triveni-07.jpeg", alt: "Art exhibition" },
  },
  {
    slug: "tree-plantation-2025",
    title: { en: "Tree Plantation Drive", ne: "वृक्षरोपण अभियान" },
    description: {
      en: "Club members planted native trees across the campus to mark the monsoon.",
      ne: "क्लब सदस्यहरूले वर्षायामको अवसरमा परिसरभरि स्थानीय रूख रोपे।",
    },
    location: { en: "School Campus", ne: "विद्यालय परिसर" },
    startsAt: "2025-07-12T08:00:00+05:45",
    endsAt: "2025-07-12T11:00:00+05:45",
    image: { src: "/gallery/triveni-03.jpeg", alt: "Tree plantation drive" },
  },
];

export function getEventBySlug(slug: string): ClubEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

/** Split events into upcoming/past relative to `now` (ISO string). */
export function splitEvents(now: string) {
  const ref = new Date(now).getTime();
  const upcoming = EVENTS.filter((e) => new Date(e.startsAt).getTime() >= ref).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const past = EVENTS.filter((e) => new Date(e.startsAt).getTime() < ref).sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );
  return { upcoming, past };
}
