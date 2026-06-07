"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { localize } from "@/lib/i18n";
import { PRIMARY_NAV } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export interface NavLink {
  label: string;
  href: string;
}

// Public nav, sourced from the content layer (skip "Home" — the logo links there).
const DEFAULT_LINKS: NavLink[] = PRIMARY_NAV.filter((i) => i.href !== "/").map(
  (i) => ({ label: localize(i.label), href: i.href })
);

export interface NavbarProps {
  links?: NavLink[];
}

export function Navbar({ links = DEFAULT_LINKS }: NavbarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="container-page flex h-[var(--header-height)] items-center justify-between gap-sp-3">
        {/* Brand */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-on-primary shadow-sm">
            <Sprout className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lead font-extrabold tracking-tight text-ink">
              Triveni
            </span>
            <span className="text-caption font-semibold text-soft">
              Child Club
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 font-heading text-body font-semibold text-soft",
                "transition-colors duration-fast hover:bg-background-subtle hover:text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-sp-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/portal">Member Portal</Link>
          </Button>
        </div>

        {/* Mobile trigger */}
        <div className="lg:hidden">
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
              </DrawerHeader>
              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <DrawerClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md px-3 py-3 font-heading text-lead font-semibold text-ink transition-colors hover:bg-background-subtle"
                    >
                      {link.label}
                    </Link>
                  </DrawerClose>
                ))}
              </nav>
              <div className="mt-sp-3 flex flex-col gap-sp-2">
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild variant="primary" size="lg">
                  <Link href="/portal">Member Portal</Link>
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
