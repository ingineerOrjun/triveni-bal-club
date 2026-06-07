"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity as ActivityIcon,
  CalendarRange,
  ClipboardList,
  UserCheck,
  Award,
  BadgeCheck,
  FileBadge,
  Trophy,
  Lightbulb,
  Users,
  FileText,
  Settings,
  ScrollText,
  KeyRound,
  Images,
  GalleryThumbnails,
  ExternalLink,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel, type UserRole } from "@/lib/auth/roles";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/admin/command-palette";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Members", href: "/admin/members", icon: Users, adminOnly: true },
  { label: "Activities", href: "/admin/activities", icon: ActivityIcon },
  { label: "Events", href: "/admin/events", icon: CalendarRange },
  { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { label: "Attendance", href: "/admin/attendance", icon: UserCheck },
  { label: "Achievements", href: "/admin/achievements", icon: Award },
  { label: "Badges", href: "/admin/badges", icon: BadgeCheck },
  { label: "Certificates", href: "/admin/certificates", icon: FileBadge },
  { label: "Recognition", href: "/admin/recognition", icon: Trophy },
  { label: "Suggestions", href: "/admin/suggestions", icon: Lightbulb },
  { label: "Media", href: "/admin/media", icon: Images },
  { label: "Gallery", href: "/admin/gallery", icon: GalleryThumbnails },
  { label: "Content", href: "/admin/content", icon: FileText, adminOnly: true },
  { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
  { label: "Roles", href: "/admin/roles", icon: KeyRound, adminOnly: true },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText, adminOnly: true },
];

export interface AdminUser {
  fullName: string;
  role: UserRole;
}

function NavLinks({
  onNavigate,
  isAdmin,
}: {
  onNavigate?: () => void;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.filter((item) => isAdmin || !item.adminOnly).map(({ label, href, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/admin" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 font-heading text-body font-semibold transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary-soft text-primary-active"
                : "text-soft hover:bg-background-subtle hover:text-ink"
            )}
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/portal"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-caption font-semibold text-soft hover:bg-background-subtle hover:text-ink"
      >
        <ExternalLink className="size-4" /> Member portal
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          <LogOut className="size-4" /> Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <aside className="hidden w-72 shrink-0 flex-col gap-sp-3 border-r border-line bg-surface px-sp-3 py-sp-4 lg:flex lg:overflow-y-auto lg:h-dvh lg:sticky lg:top-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-ink text-ink-inverse">
            <ShieldCheck className="size-5" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lead font-extrabold text-ink">
              Admin
            </span>
            <span className="text-caption font-semibold text-soft">
              {roleLabel(user.role)}
            </span>
          </div>
        </div>
        <Badge variant="soft" className="w-fit">
          {user.fullName}
        </Badge>
        <CommandPalette />
        <div className="flex-1">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <Footer />
      </aside>

      <header className="flex items-center justify-between border-b border-line bg-surface px-sp-2 py-sp-2 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-md bg-ink text-ink-inverse">
            <ShieldCheck className="size-5" />
          </span>
          <span className="font-display text-lead font-extrabold text-ink">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CommandPalette />
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Admin menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-sp-3">
                <NavLinks onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
                <Footer />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </header>

      <main className="flex-1 px-sp-2 py-sp-4 sm:px-sp-4">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
