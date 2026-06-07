import Link from "next/link";
import { Sprout } from "lucide-react";
import { SITE } from "@/content/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-sp-2 py-sp-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--emerald-100)_0%,transparent_70%)]"
      />
      <div className="w-full max-w-md">
        <div className="mb-sp-3 flex flex-col items-center gap-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-md bg-primary text-on-primary shadow-sm">
              <Sprout className="size-6" />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="font-display text-h3 font-extrabold tracking-tight text-ink">
                {SITE.name}
              </span>
              <span className="text-caption font-semibold text-soft">
                Member Portal
              </span>
            </span>
          </Link>
        </div>

        <div className="rounded-xl border border-line bg-surface p-sp-4 shadow-lg">
          {children}
        </div>

        <p className="mt-sp-3 text-center text-caption text-soft">
          <Link
            href="/"
            className="rounded-sm font-semibold text-primary-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
