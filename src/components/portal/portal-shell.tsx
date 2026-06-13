"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  Trophy,
  CalendarRange,
  CalendarHeart,
  Activity as ActivityIcon,
  BadgeCheck,
  FileBadge,
  Lightbulb,
  MessageSquare,
  Vote,
  Newspaper,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel, type UserRole } from "@/lib/auth/roles";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const NAV = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Activities", href: "/portal/activities", icon: ActivityIcon },
  { label: "Events", href: "/portal/events", icon: CalendarRange },
  { label: "Participation", href: "/portal/participation", icon: CalendarHeart },
  { label: "Achievements", href: "/portal/achievements", icon: Trophy },
  { label: "Badges", href: "/portal/badges", icon: BadgeCheck },
  { label: "Certificates", href: "/portal/certificates", icon: FileBadge },
  { label: "Suggestions", href: "/portal/suggestions", icon: Lightbulb },
  { label: "My Ideas", href: "/portal/my-suggestions", icon: MessageSquare },
  { label: "Elections", href: "/portal/elections", icon: Vote },
  { label: "Magazine", href: "/portal/magazine", icon: Newspaper },
  { label: "Profile", href: "/portal/profile", icon: UserRound },
  { label: "Account", href: "/settings/account", icon: Settings },
];

export interface PortalUser {
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function NavLinks({
  onNavigate,
  isStaff,
}: {
  onNavigate?: () => void;
  isStaff?: boolean;
}) {
  const pathname = usePathname();
  const items = isStaff
    ? [...NAV, { label: "Admin area", href: "/admin", icon: ShieldCheck }]
    : NAV;
  return (
    <nav className="flex flex-col gap-1" aria-label="Portal">
      {items.map(({ label, href, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/portal" && pathname.startsWith(`${href}/`));
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

function UserCard({ user }: { user: PortalUser }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-sp-2">
      <Avatar size="md">
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-body font-bold text-ink">
          {user.fullName}
        </p>
        <p className="truncate text-caption text-soft">{user.email}</p>
      </div>
    </div>
  );
}

function SignOutForm({ full = false }: { full?: boolean }) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="outline"
        size={full ? "lg" : "sm"}
        className={cn(full && "w-full")}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </form>
  );
}

// Curated primary destinations for the mobile bottom bar.
const BOTTOM_NAV = [
  { label: "Home", href: "/portal", icon: LayoutDashboard },
  { label: "Activities", href: "/portal/activities", icon: ActivityIcon },
  { label: "Magazine", href: "/portal/magazine", icon: Newspaper },
  { label: "Awards", href: "/portal/achievements", icon: Trophy },
  { label: "Profile", href: "/portal/profile", icon: UserRound },
];

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {BOTTOM_NAV.map(({ label, href, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/portal" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-[0.7rem] font-heading font-semibold transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-primary-active" : "text-soft hover:text-ink"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalShell({
  user,
  children,
}: {
  user: PortalUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isStaff = user.role === "moderator" || user.role === "admin";

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col gap-sp-3 border-r border-line bg-surface px-sp-3 py-sp-4 lg:flex">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-on-primary">
            <Sprout className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lead font-extrabold text-ink">
              Triveni
            </span>
            <span className="text-caption font-semibold text-soft">
              Member Portal
            </span>
          </span>
        </Link>

        <div className="flex items-center justify-between">
          <UserCard user={user} />
        </div>
        <Badge variant="soft" className="w-fit">
          {roleLabel(user.role)}
        </Badge>

        <div className="flex-1">
          <NavLinks isStaff={isStaff} />
        </div>

        <SignOutForm full />
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-sp-2 py-sp-2 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary text-on-primary">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-lead font-extrabold text-ink">
            Portal
          </span>
        </Link>
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
            <div className="flex flex-col gap-sp-3">
              <UserCard user={user} />
              <NavLinks onNavigate={() => setOpen(false)} isStaff={isStaff} />
              <SignOutForm full />
            </div>
          </DrawerContent>
        </Drawer>
      </header>

      {/* Main content */}
      <main className="flex-1 px-sp-2 py-sp-4 pb-24 sm:px-sp-4 lg:pb-sp-4">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
