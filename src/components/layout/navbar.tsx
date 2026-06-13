"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, Search, X, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PUBLIC_NAV, type NavGroup } from "@/content/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/* -------------------------- desktop dropdown ----------------------------- */
/**
 * Compact, trigger-aligned dropdown that reads as a floating premium card
 * (near-solid surface, soft elevation, hairline border). Opens on hover +
 * keyboard focus; motion is opacity + a 6px lift only.
 */
function Dropdown({ group, alignRight }: { group: NavGroup; alignRight?: boolean }) {
  return (
    <div
      className={cn(
        // pt-2 is a transparent "bridge" so moving the cursor from the trigger to
        // the card never leaves the hoverable area (the card no longer vanishes).
        "invisible pointer-events-none absolute top-full z-[60] w-[340px] pt-2 translate-y-1.5 opacity-0",
        "transition-[opacity,transform] duration-fast ease-out",
        "group-hover/nav:visible group-hover/nav:pointer-events-auto group-hover/nav:translate-y-0 group-hover/nav:opacity-100",
        "group-focus-within/nav:visible group-focus-within/nav:pointer-events-auto group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100",
        alignRight ? "right-0" : "left-0"
      )}
      role="menu"
    >
      <div className="menu-surface overflow-hidden rounded-lg border border-line p-1.5 shadow-xl">
        <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
          {group.label}
        </p>
        {group.items.map(({ label, href, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            role="menuitem"
            className={cn(
              "group/item flex items-start gap-3 rounded-button border-l-[3px] border-transparent p-3 transition-colors duration-fast",
              "hover:border-primary hover:bg-background-subtle",
              "focus-visible:outline-none focus-visible:border-primary focus-visible:bg-background-subtle"
            )}
          >
            <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary-active transition-[background-color,color,transform] duration-fast group-hover/item:translate-x-0.5 group-hover/item:bg-primary group-hover/item:text-on-primary">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink transition-colors group-hover/item:text-primary-active">
                {label}
              </span>
              <span className="menu-desc block text-[13px] leading-snug">{description}</span>
            </span>
            <ArrowRight className="mt-2 size-4 shrink-0 -translate-x-1 text-primary-active opacity-0 transition-[opacity,transform] duration-fast group-hover/item:translate-x-0 group-hover/item:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- hamburger --------------------------------- */
function Hamburger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="relative inline-flex size-11 items-center justify-center rounded-button border border-line bg-surface text-ink transition-colors hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
    >
      <span className="relative block h-3.5 w-5">
        <span className={cn("absolute left-0 h-0.5 w-5 rounded-pill bg-current transition-all duration-fast", open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0")} />
        <span className={cn("absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-pill bg-current transition-opacity duration-fast", open && "opacity-0")} />
        <span className={cn("absolute left-0 h-0.5 w-5 rounded-pill bg-current transition-all duration-fast", open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0")} />
      </span>
    </button>
  );
}

/* --------------------------- mobile side panel --------------------------- */
function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-navy-900/55 backdrop-blur-sm transition-opacity duration-base",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* Right slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col overflow-hidden border-l border-line bg-surface shadow-xl",
          "transition-transform duration-base ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Light gradient wash so the menu reads as a distinct layer above the page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: "linear-gradient(180deg, color-mix(in oklab, var(--primary) 12%, var(--surface)) 0%, var(--surface) 42%)" }}
        />

        <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-line px-sp-3">
          <Link href="/" onClick={onClose} className="inline-flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-button bg-primary text-on-primary"><Sprout className="size-5" /></span>
            <span className="font-display text-lead font-extrabold text-ink">Triveni</span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex size-10 items-center justify-center rounded-button text-soft transition-colors hover:bg-background-subtle hover:text-ink active:bg-primary-soft">
            <X className="size-5" />
          </button>
        </div>

        <nav
          key={open ? "open" : "closed"}
          className={cn("flex-1 overflow-y-auto px-sp-2 py-sp-2", open && "stagger-children")}
          aria-label="Primary"
        >
          {PUBLIC_NAV.map((entry) =>
            entry.kind === "link" ? (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={onClose}
                className="group/m flex items-center justify-between rounded-lg px-3 py-3 font-heading text-body font-semibold text-ink transition-colors hover:bg-background-subtle active:bg-primary-soft"
              >
                {entry.label}
                <ArrowRight className="size-4 -translate-x-1 text-primary-active opacity-0 transition-[opacity,transform] duration-fast group-hover/m:translate-x-0 group-hover/m:opacity-100" />
              </Link>
            ) : (
              <div key={entry.label}>
                <button
                  type="button"
                  onClick={() => setExpanded((p) => (p === entry.label ? null : entry.label))}
                  aria-expanded={expanded === entry.label}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-3 font-heading text-body font-semibold transition-colors active:bg-primary-soft",
                    expanded === entry.label ? "bg-primary-soft/60 text-primary-active" : "text-ink hover:bg-background-subtle"
                  )}
                >
                  {entry.label}
                  <ChevronDown className={cn("size-4 text-soft transition-transform duration-fast", expanded === entry.label && "rotate-180 text-primary-active")} />
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-base ease-out", expanded === entry.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <ul className="ml-3 flex flex-col gap-0.5 overflow-hidden border-l border-line pl-2">
                    {entry.group.items.map(({ label, href, icon: Icon }) => (
                      <li key={href}>
                        <Link href={href} onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-body text-soft transition-colors hover:bg-primary-soft/60 hover:text-ink active:bg-primary-soft">
                          <Icon className="size-4 text-primary-active" /> {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          )}
        </nav>

        <div className="flex shrink-0 flex-col gap-sp-2 border-t border-line bg-surface/80 p-sp-3 backdrop-blur">
          <Button asChild variant="primary" size="lg" className="w-full"><Link href="/portal" onClick={onClose}>Member Portal</Link></Button>
          <Button asChild variant="outline" size="lg" className="w-full"><Link href="/auth/login" onClick={onClose}>Log in</Link></Button>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------- navbar ---------------------------------- */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const groupCount = PUBLIC_NAV.filter((e) => e.kind === "group").length;
  let groupIndex = -1;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-[background-color,box-shadow,border-color] duration-base",
        scrolled ? "glass border-b border-line shadow-sm" : "border-b border-transparent bg-surface/50 backdrop-blur supports-[backdrop-filter]:bg-surface/30"
      )}
    >
      <div className="container-page flex h-[var(--header-height)] items-center justify-between gap-sp-3">
        {/* Brand */}
        <Link href="/" className="group inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="inline-flex size-10 items-center justify-center rounded-button bg-primary text-on-primary shadow-sm transition-transform duration-fast group-hover:scale-105">
            <Sprout className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lead font-extrabold tracking-tight text-ink">Triveni</span>
            <span className="text-caption font-semibold text-soft">Digital Platform</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {PUBLIC_NAV.map((entry) => {
            if (entry.kind === "link") {
              const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  className="nav-underline rounded-md px-3 py-2 font-heading text-caption font-semibold uppercase tracking-[0.08em] text-soft transition-colors duration-fast hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {entry.label}
                </Link>
              );
            }
            groupIndex += 1;
            const alignRight = groupIndex >= groupCount - 1; // last group hugs the right edge
            return (
              <div key={entry.label} className="group/nav relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 font-heading text-caption font-semibold uppercase tracking-[0.08em] text-soft transition-colors duration-fast hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {entry.label}
                  <ChevronDown className="size-4 transition-transform duration-fast group-hover/nav:rotate-180" />
                </button>
                <Dropdown group={entry.group} alignRight={alignRight} />
              </div>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-sp-2 lg:flex">
          <Link href="/magazine" aria-label="Search stories" className="inline-flex size-9 items-center justify-center rounded-button border border-line bg-surface text-soft transition-colors hover:bg-background-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Search className="size-4" />
          </Link>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm"><Link href="/auth/login">Log in</Link></Button>
          <Button asChild variant="primary" size="sm"><Link href="/portal">Member Portal</Link></Button>
        </div>

        {/* Mobile trigger */}
        <div className="flex items-center gap-sp-2 lg:hidden">
          <ThemeToggle />
          <Hamburger open={mobileOpen} onClick={() => setMobileOpen((o) => !o)} />
        </div>
      </div>
    </header>

    {/* Rendered OUTSIDE the header so its fixed positioning is relative to the
        viewport (the header's backdrop-blur would otherwise clip it). */}
    <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
