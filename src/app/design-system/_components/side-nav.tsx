"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Overview", href: "/design-system" },
  { label: "Colors", href: "/design-system/colors" },
  { label: "Typography", href: "/design-system/typography" },
  { label: "Components", href: "/design-system/components" },
  { label: "Layout", href: "/design-system/layout" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Design system sections" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 font-heading text-body font-semibold transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary-soft text-primary-active"
                : "text-soft hover:bg-background-subtle hover:text-ink"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
