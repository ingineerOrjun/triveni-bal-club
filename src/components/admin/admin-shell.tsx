"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
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
  Upload,
  Download,
  LayoutTemplate,
  ListTree,
  Vote,
  Newspaper,
  ExternalLink,
  LogOut,
  Menu,
  ShieldCheck,
  PenSquare,
  CalendarPlus,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
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

/** Grouped, workflow-oriented navigation. */
const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Workspace",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Approvals", href: "/admin/approvals", icon: ClipboardCheck },
      { label: "Members", href: "/admin/members", icon: Users, adminOnly: true },
    ],
  },
  {
    heading: "Programs",
    items: [
      { label: "Activities", href: "/admin/activities", icon: ActivityIcon },
      { label: "Events", href: "/admin/events", icon: CalendarRange },
      { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
      { label: "Attendance", href: "/admin/attendance", icon: UserCheck },
    ],
  },
  {
    heading: "Recognition",
    items: [
      { label: "Achievements", href: "/admin/achievements", icon: Award },
      { label: "Badges", href: "/admin/badges", icon: BadgeCheck },
      { label: "Certificates", href: "/admin/certificates", icon: FileBadge },
      { label: "Recognition", href: "/admin/recognition", icon: Trophy },
    ],
  },
  {
    heading: "Voice & governance",
    items: [
      { label: "Suggestions", href: "/admin/suggestions", icon: Lightbulb },
      { label: "Elections", href: "/admin/elections", icon: Vote },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Magazine", href: "/admin/magazine", icon: Newspaper },
      { label: "Media", href: "/admin/media", icon: Images },
      { label: "Gallery", href: "/admin/gallery", icon: GalleryThumbnails },
      { label: "Pages", href: "/admin/pages", icon: LayoutTemplate },
      { label: "Menus", href: "/admin/menus", icon: ListTree },
      { label: "Content", href: "/admin/content", icon: FileText, adminOnly: true },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
      { label: "Roles", href: "/admin/roles", icon: KeyRound, adminOnly: true },
      { label: "Import", href: "/admin/import", icon: Upload, adminOnly: true },
      { label: "Export", href: "/admin/export", icon: Download, adminOnly: true },
      { label: "Audit Log", href: "/admin/audit", icon: ScrollText, adminOnly: true },
    ],
  },
];

const QUICK_CREATE = [
  { label: "Article", href: "/admin/magazine/articles/new", icon: PenSquare },
  { label: "Event", href: "/admin/events/new", icon: CalendarPlus },
  { label: "Activity", href: "/admin/activities/new", icon: ActivityIcon },
  { label: "Election", href: "/admin/elections/new", icon: Vote },
];

export interface AdminContextData {
  approvalsTotal: number;
  approvals: { title: string; count: number; href: string }[];
  recent: { id: string; action: string; entity: string; at: string }[];
}

export interface AdminUser {
  fullName: string;
  role: UserRole;
}

function NavLinks({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-sp-3" aria-label="Admin">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => isAdmin || !item.adminOnly);
        if (items.length === 0) return null;
        return (
          <div key={group.heading} className="flex flex-col gap-1">
            <p className="nav-label px-3 pb-1 text-soft">{group.heading}</p>
            {items.map(({ label, href, icon: Icon }) => {
              const active =
                pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-button px-3 py-2 font-heading text-body font-semibold transition-all duration-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary-soft text-ink shadow-sm"
                      : "text-soft hover:bg-primary-soft/60 hover:text-ink"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0 transition-colors", active ? "text-accent" : "text-soft group-hover:text-ink")} />
                  {label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-10 items-center justify-center rounded-button bg-gradient-brand text-white shadow-glow">
        <ShieldCheck className="size-5" />
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-display text-lead font-extrabold tracking-tight text-ink">Admin OS</span>
        <span className="nav-label text-soft">Triveni</span>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/portal"
        className="flex items-center gap-2 rounded-button px-3 py-2 text-caption font-semibold text-soft hover:bg-primary-soft/60 hover:text-ink"
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

/* ------------------------------- live clock ------------------------------- */
function LiveClock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  // Render a stable placeholder on the server / first paint to avoid mismatch.
  const time = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—:—:—";
  const date = now
    ? now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
    : "";
  return (
    <div className="glass flex items-center gap-2 rounded-lg border border-line px-sp-2 py-2">
      <Clock className="size-4 text-soft" />
      <div className="leading-tight">
        <p className="font-display text-body font-bold tabular-nums text-ink">{time}</p>
        <p className="text-caption text-soft">{date || " "}</p>
      </div>
    </div>
  );
}

/* ----------------------------- context panel ------------------------------ */
function ContextPanel({ user, context }: { user: AdminUser; context: AdminContextData }) {
  return (
    <div className="flex flex-col gap-sp-3">
      <LiveClock />

      {/* Quick create */}
      <section>
        <p className="os-eyebrow mb-sp-2 flex items-center gap-1.5">
          <Plus className="size-3.5" /> Quick create
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_CREATE.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-button border border-line bg-surface-2/60 px-2.5 py-2 text-caption font-semibold text-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              <Icon className="size-4 text-accent" /> {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Approvals */}
      <section className="rounded-lg border border-line bg-surface-2/40 p-sp-3">
        <p className="os-eyebrow mb-sp-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><ClipboardCheck className="size-3.5" /> Pending approvals</span>
          <Badge variant={context.approvalsTotal > 0 ? "warning" : "success"}>{context.approvalsTotal}</Badge>
        </p>
        {context.approvals.length === 0 ? (
          <p className="text-caption text-soft">All caught up.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {context.approvals.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-caption text-soft hover:bg-primary-soft/50 hover:text-ink">
                  <span className="truncate">{a.title}</span>
                  <span className="shrink-0 font-bold text-ink">{a.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="primary" size="sm" className="mt-sp-2 w-full">
          <Link href="/admin/approvals">Open center</Link>
        </Button>
      </section>

      {/* Recent activity */}
      <section className="rounded-lg border border-line bg-surface-2/40 p-sp-3">
        <p className="os-eyebrow mb-sp-2 flex items-center gap-1.5">
          <Sparkles className="size-3.5" /> Recent activity
        </p>
        {context.recent.length === 0 ? (
          <p className="text-caption text-soft">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {context.recent.map((r) => (
              <li key={r.id} className="flex flex-col">
                <code className="truncate text-caption text-ink">{r.action}</code>
                <span className="text-caption text-soft">{r.entity} · {formatDateTime(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/audit" className="mt-sp-2 inline-block text-caption font-semibold text-accent hover:underline">
          View full log
        </Link>
      </section>

      <p className="px-1 text-caption text-soft">
        Signed in as <span className="font-semibold text-ink">{user.fullName}</span> · {roleLabel(user.role)}
      </p>
    </div>
  );
}

export function AdminShell({
  user,
  context,
  children,
}: {
  user: AdminUser;
  context: AdminContextData;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isAdmin = user.role === "admin";

  return (
    <div className="admin-os flex min-h-dvh flex-col bg-background text-ink lg:flex-row">
      {/* LEFT — navigation (glass) */}
      <aside className="glass sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-sp-3 overflow-y-auto border-r border-line px-sp-3 py-sp-4 lg:flex">
        <Brand />
        <Badge variant="soft" className="w-fit">{user.fullName}</Badge>
        <CommandPalette />
        <div className="flex-1">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-line px-sp-2 py-sp-2 lg:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <CommandPalette />
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="admin-os bg-background text-ink">
              <DrawerHeader>
                <DrawerTitle>Admin menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-sp-3">
                <NavLinks onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
                <SidebarFooter />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </header>

      {/* CENTER — workspace */}
      <main className="min-w-0 flex-1 px-sp-2 py-sp-4 sm:px-sp-4">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* RIGHT — context panel (desktop XL) */}
      <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 overflow-y-auto border-l border-line px-sp-3 py-sp-4 xl:block">
        <ContextPanel user={user} context={context} />
      </aside>
    </div>
  );
}
