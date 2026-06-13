import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Users, BookOpen, TrendingUp, Eye, Heart, CalendarRange } from "lucide-react";
import { getAnalytics } from "@/lib/magazine/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/admin/bar-chart";
import { AnalyticsCard } from "@/components/magazine/analytics-card";

export const metadata: Metadata = { title: "Magazine analytics", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MagazineAnalyticsPage() {
  const a = await getAnalytics();
  const monthly = a.monthly.map((m) => ({ label: m.month, value: m.count }));

  return (
    <>
      <PortalPageHeader title="Analytics" description="Readership and editorial output across the magazine." />

      <div className="mb-sp-4 grid gap-sp-4 lg:grid-cols-3">
        <AnalyticsCard title="Popular categories" icon={FolderOpen} items={a.popularCategories} />
        <AnalyticsCard title="Top authors" icon={Users} items={a.popularAuthors} />
        <AnalyticsCard title="Popular editions" icon={BookOpen} items={a.popularEditions} />
      </div>

      <div className="grid gap-sp-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarRange className="size-5 text-primary-active" /> Articles published by month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? <p className="text-body text-soft">No published articles yet.</p> : <BarChart data={monthly} accent="accent" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-accent-active" /> Top stories</CardTitle>
          </CardHeader>
          <CardContent>
            {a.topStories.length === 0 ? (
              <p className="text-body text-soft">No published stories yet.</p>
            ) : (
              <ol className="flex flex-col divide-y divide-line">
                {a.topStories.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 py-2">
                    <span className="font-display text-lead font-extrabold text-soft">{i + 1}</span>
                    <Link href={`/magazine/article/${s.slug}`} target="_blank" className="min-w-0 flex-1 truncate font-heading font-semibold text-ink hover:text-primary-active">
                      {s.title}
                    </Link>
                    <span className="inline-flex items-center gap-1 text-caption text-soft"><Eye className="size-3.5" /> {s.views}</span>
                    <span className="inline-flex items-center gap-1 text-caption text-soft"><Heart className="size-3.5" /> {s.likes}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
