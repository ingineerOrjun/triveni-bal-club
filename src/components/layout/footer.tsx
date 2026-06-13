import * as React from "react";
import Link from "next/link";
import {
  Sprout,
  Mail,
  MapPin,
  Phone,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  ArrowUp,
} from "lucide-react";
import { SITE, CONTACT, SOCIAL } from "@/content/site";
import { localize } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "About", href: "/about" },
      { label: "Activities", href: "/activities" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/gallery" },
      { label: "Achievements", href: "/achievements" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Committee", href: "/committee" },
      { label: "Authors", href: "/authors" },
      { label: "Hall of Fame", href: "/hall-of-fame" },
      { label: "Student Voice", href: "/student-voice" },
    ],
  },
  {
    title: "Magazine & more",
    links: [
      { label: "Magazine", href: "/magazine" },
      { label: "Write for us", href: "/portal/magazine/new" },
      { label: "Elections", href: "/elections" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: SOCIAL.facebook, icon: Facebook },
  { label: "Instagram", href: SOCIAL.instagram, icon: Instagram },
  { label: "YouTube", href: SOCIAL.youtube, icon: Youtube },
];

export function Footer() {
  const year = 2026; // static for deterministic render; update yearly

  return (
    <footer className="relative isolate overflow-hidden border-t border-line bg-ink text-slate-300">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ backgroundImage: "radial-gradient(40% 60% at 0% 0%, rgb(37 99 235 / 0.14) 0%, transparent 55%), radial-gradient(40% 60% at 100% 100%, rgb(124 58 237 / 0.12) 0%, transparent 55%)" }}
      />
      <div className="container-page py-sp-6">
        <div className="grid gap-sp-5 md:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)_1.2fr]">
          {/* Brand */}
          <div className="flex flex-col gap-sp-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex size-11 items-center justify-center rounded-button bg-primary text-on-primary shadow-glow">
                <Sprout className="size-6" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-lead font-extrabold text-ink-inverse">Triveni Child Club</span>
                <span className="text-caption font-semibold text-slate-400">Barah Nanda Prasad Tripathee School</span>
              </span>
            </Link>
            <p className="max-w-sm text-body text-slate-400">{localize(SITE.tagline)}</p>
            <div className="mt-sp-1 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-button border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            <p lang="ne" className="mt-sp-1 font-nepali text-caption text-slate-500">{SITE.nameNe}</p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-sp-2">
              <h2 className="font-heading text-caption font-bold uppercase tracking-[0.12em] text-slate-400">{col.title}</h2>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}`}>
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

          {/* Contact */}
          <div className="flex flex-col gap-sp-2">
            <h2 className="font-heading text-caption font-bold uppercase tracking-[0.12em] text-slate-400">Contact</h2>
            <ul className="flex flex-col gap-2 text-body text-slate-300">
              <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0 text-accent" /> {localize(CONTACT.address)}</li>
              <li className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-accent" /> {CONTACT.email}</li>
              <li className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-accent" /> {CONTACT.phone}</li>
              <li className="flex items-center gap-2"><Clock className="size-4 shrink-0 text-accent" /> {localize(CONTACT.hours)}</li>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-sp-5 flex flex-col items-start justify-between gap-sp-2 border-t border-white/10 pt-sp-3 text-caption text-slate-400 sm:flex-row sm:items-center">
          <p>© {year} Triveni Child Club · All rights reserved</p>
          <div className="flex items-center gap-sp-3">
            <span>Digital Platform · v1.0</span>
            <ThemeToggle />
            <a href="#" className="inline-flex items-center gap-1 rounded-button border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
              <ArrowUp className="size-4" /> Top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
