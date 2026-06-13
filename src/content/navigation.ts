import {
  Target,
  CalendarDays,
  Trophy,
  Award,
  Image as ImageIcon,
  Users,
  PenSquare,
  MessageSquare,
  Newspaper,
  Vote,
  type LucideIcon,
} from "lucide-react";

/**
 * Metadata-driven public navigation. Adding a module = add an entry here; the
 * navbar, mega menus, and mobile nav all generate from this single source.
 * Only routes that actually exist are listed (no dead links).
 */

export interface NavLeaf {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavLeaf[];
  /** Featured CTA shown in the mega menu. */
  featured: { label: string; description: string; href: string };
}

export type NavEntry =
  | { kind: "link"; label: string; href: string }
  | { kind: "group"; label: string; group: NavGroup };

export const PUBLIC_NAV: NavEntry[] = [
  { kind: "link", label: "About", href: "/about" },
  {
    kind: "group",
    label: "Programs",
    group: {
      label: "Programs",
      featured: {
        label: "Upcoming events",
        description: "See what's happening across the club this term.",
        href: "/events",
      },
      items: [
        { label: "Activities", href: "/activities", description: "Clubs, projects, and student-led initiatives.", icon: Target },
        { label: "Events", href: "/events", description: "Meetings, fairs, and celebrations.", icon: CalendarDays },
        { label: "Achievements", href: "/achievements", description: "Awards and proud moments.", icon: Trophy },
        { label: "Hall of Fame", href: "/hall-of-fame", description: "Our most recognized members.", icon: Award },
        { label: "Gallery", href: "/gallery", description: "Photo albums from our programs.", icon: ImageIcon },
      ],
    },
  },
  {
    kind: "group",
    label: "Community",
    group: {
      label: "Community",
      featured: {
        label: "Meet the committee",
        description: "The student leaders running the club.",
        href: "/committee",
      },
      items: [
        { label: "Committee", href: "/committee", description: "Elected leadership and roles.", icon: Users },
        { label: "Authors", href: "/authors", description: "The writers behind our stories.", icon: PenSquare },
        { label: "Student Voice", href: "/student-voice", description: "Ideas and suggestions from members.", icon: MessageSquare },
      ],
    },
  },
  {
    kind: "group",
    label: "Magazine",
    group: {
      label: "Magazine",
      featured: {
        label: "Read the latest",
        description: "Stories, reports, and features by our members.",
        href: "/magazine",
      },
      items: [
        { label: "Latest stories", href: "/magazine", description: "The newest published articles.", icon: Newspaper },
        { label: "Authors & contributors", href: "/authors", description: "Browse writers and their portfolios.", icon: Users },
        { label: "Write for us", href: "/portal/magazine/new", description: "Members can submit an article.", icon: PenSquare },
      ],
    },
  },
  { kind: "link", label: "Elections", href: "/elections" },
  { kind: "link", label: "Contact", href: "/contact" },
];

/** Flat list (used for the mobile accordion fallback + sitemap-style needs). */
export const PUBLIC_NAV_FLAT: { label: string; href: string; icon?: LucideIcon }[] = PUBLIC_NAV.flatMap(
  (e) =>
    e.kind === "link"
      ? [{ label: e.label, href: e.href }]
      : e.group.items.map((i) => ({ label: i.label, href: i.href, icon: i.icon }))
);

export { Vote };
