import * as React from "react";
import Link from "next/link";
import { Sprout, Mail, MapPin, Phone } from "lucide-react";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "About", href: "/about" },
      { label: "Committee", href: "/committee" },
      { label: "Activities", href: "/activities" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Achievements", href: "/achievements" },
      { label: "Hall of Fame", href: "/hall-of-fame" },
      { label: "Student Voice", href: "/student-voice" },
      { label: "Elections", href: "/elections" },
      { label: "Magazine", href: "/magazine" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Portal",
    links: [
      { label: "Member Login", href: "/auth/login" },
      { label: "Dashboard", href: "/portal" },
      { label: "Design System", href: "/design-system" },
    ],
  },
];

export function Footer() {
  const year = 2026; // static for deterministic render; update yearly

  return (
    <footer className="border-t border-line bg-ink text-slate-300">
      <div className="container-page py-sp-6">
        <div className="grid gap-sp-5 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* Brand block */}
          <div className="flex flex-col gap-sp-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-on-primary">
                <Sprout className="size-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-lead font-extrabold text-ink-inverse">
                  Triveni Child Club
                </span>
                <span className="text-caption font-semibold text-slate-400">
                  Barah Nanda Prasad Tripathee School
                </span>
              </span>
            </Link>
            <p className="max-w-sm text-body text-slate-400">
              A student-led community building leadership, creativity, and civic
              spirit — one activity at a time.
            </p>
            <ul className="mt-sp-1 flex flex-col gap-1.5 text-caption text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" /> Nepal
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-accent" /> club@triveni.edu.np
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-accent" /> +977 00-000000
              </li>
            </ul>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-sp-2">
              <h2 className="font-heading text-caption font-bold uppercase tracking-wide text-slate-400">
                {col.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-body text-slate-300 transition-colors duration-fast hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-sp-5 flex flex-col items-start justify-between gap-sp-2 border-t border-navy-700 pt-sp-3 text-caption text-slate-400 sm:flex-row sm:items-center">
          <p>© {year} Triveni Child Club. All rights reserved.</p>
          <p lang="ne" className="font-nepali">
            त्रिवेणी बाल क्लब
          </p>
        </div>
      </div>
    </footer>
  );
}
