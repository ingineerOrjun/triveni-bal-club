"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  CalendarPlus,
  Activity as ActivityIcon,
  Image as ImageIcon,
  Award,
  UserPlus,
  Trophy,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { adminSearch, type SearchGroup } from "@/lib/admin/search";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  { label: "Create event", href: "/admin/events/new", icon: CalendarPlus },
  { label: "Create activity", href: "/admin/activities/new", icon: ActivityIcon },
  { label: "Issue certificate", href: "/admin/certificates/new", icon: Award },
  { label: "New badge", href: "/admin/badges/new", icon: ImageIcon },
  { label: "Award achievement", href: "/admin/achievements/new", icon: Trophy },
  { label: "Add member", href: "/admin/members", icon: UserPlus },
  { label: "Review suggestions", href: "/admin/suggestions", icon: Lightbulb },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [groups, setGroups] = React.useState<SearchGroup[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setGroups([]);
      return;
    }
  }, [open]);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await adminSearch(q);
        setGroups(res);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-soft"
        aria-label="Open global search"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border border-line bg-background-subtle px-1.5 text-[0.7rem] sm:inline">
          Ctrl K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 p-0">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <div className="flex items-center gap-2 border-b border-line px-sp-3 py-sp-2">
            {loading ? (
              <Loader2 className="size-5 animate-spin text-soft" />
            ) : (
              <Search className="size-5 text-soft" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members, events, magazine, elections, pages…"
              aria-label="Search"
              className="h-9 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-soft"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-sp-2">
            {query.trim().length < 2 ? (
              <Section title="Quick actions">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.href}
                    onClick={() => go(a.href)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-body text-ink hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <a.icon className="size-4 text-primary-active" /> {a.label}
                  </button>
                ))}
              </Section>
            ) : groups.length === 0 && !loading ? (
              <p className="px-3 py-sp-3 text-center text-body text-soft">
                No results for “{query}”.
              </p>
            ) : (
              groups.map((g) => (
                <Section key={g.module} title={g.module}>
                  {g.hits.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => go(h.href)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-body text-ink">
                          {h.label}
                        </span>
                        {h.sub ? (
                          <span className="block truncate text-caption text-soft">
                            {h.sub}
                          </span>
                        ) : null}
                      </span>
                      <CornerDownLeft className="size-4 shrink-0 text-soft" />
                    </button>
                  ))}
                </Section>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-sp-2 last:mb-0">
      <p className="px-3 py-1 text-caption font-bold uppercase tracking-wide text-soft">
        {title}
      </p>
      {children}
    </div>
  );
}
