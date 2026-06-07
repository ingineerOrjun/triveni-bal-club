import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SideNav } from "./_components/side-nav";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "The Triveni Civic-Optimist design system — tokens, typography, and components.",
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <div className="container-page flex-1 py-sp-4">
        <div className="grid gap-sp-4 lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
            <div className="mb-sp-2">
              <Link
                href="/design-system"
                className="font-display text-h3 font-extrabold text-ink"
              >
                Design System
              </Link>
              <p className="text-caption text-soft">Triveni · Civic-Optimist</p>
            </div>
            <SideNav />
          </aside>

          {/* Content */}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
