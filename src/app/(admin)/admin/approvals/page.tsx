import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import {
  Newspaper,
  MessageSquare,
  Lightbulb,
  Vote,
  Trophy,
  BadgeCheck,
  LayoutTemplate,
  ArrowRight,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { getApprovalCenter } from "@/lib/admin/approvals";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Approvals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Newspaper, MessageSquare, Lightbulb, Vote, Trophy, BadgeCheck, LayoutTemplate,
};

export default async function ApprovalCenterPage() {
  const { buckets, total } = await getApprovalCenter();
  const active = buckets.filter((b) => b.count > 0);

  return (
    <>
      <PageHeader
        title="Approval center"
        subtitle="Everything across the platform that's waiting on staff action — in one place."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Approvals" }]}
        badge={
          <Badge variant={total > 0 ? "warning" : "success"} className="text-body">
            {total} pending
          </Badge>
        }
      />

      {active.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="There's nothing waiting for review or approval right now. New submissions will appear here automatically."
          action={
            <Button asChild variant="primary">
              <Link href="/admin">Back to dashboard</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
          {active.map((bucket) => {
            const Icon = ICONS[bucket.icon] ?? Inbox;
            return (
              <Card key={bucket.key} interactive className="flex flex-col">
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-h3">
                    <span className="inline-flex size-9 items-center justify-center rounded-button bg-primary-soft text-primary-active">
                      <Icon className="size-5" />
                    </span>
                    {bucket.title}
                  </CardTitle>
                  <Badge variant="warning">{bucket.count}</Badge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-sp-2">
                  <ul className="flex flex-1 flex-col divide-y divide-line">
                    {bucket.items.map((item) => (
                      <li key={item.id} className="py-2">
                        <Link
                          href={item.href}
                          className="block rounded-md text-body font-semibold text-ink hover:text-primary-active focus-visible:outline-none focus-visible:underline"
                        >
                          <span className="line-clamp-1">{item.label}</span>
                          {item.sub ? <span className="block truncate text-caption font-normal text-soft">{item.sub}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
                    <Link href={bucket.href}>
                      Review all <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
