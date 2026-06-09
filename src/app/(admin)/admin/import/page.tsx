import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { MODULES } from "@/lib/dataio/registry";
import { listImportJobs, getIoAnalytics } from "@/lib/dataio/jobs";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { ImportWizard } from "@/components/dataio/import-wizard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileCheck2, FileX2, Gauge } from "lucide-react";

export const metadata: Metadata = {
  title: "Import data",
  robots: { index: false, follow: false },
};

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");

  const importable = MODULES.filter((m) => m.supportsImport);
  const [jobs, analytics] = await Promise.all([listImportJobs(10), getIoAnalytics()]);

  return (
    <>
      <PortalPageHeader
        title="Import data"
        description="Bring data into the portal through a guided, validated wizard."
      />

      <div className="mb-sp-4 grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
        <StatCard icon={Upload} label="Imports today" value={analytics.importsToday} />
        <StatCard icon={FileCheck2} label="Success rate" value={`${analytics.importSuccessRate}%`} accent="accent" />
        <StatCard icon={FileX2} label="Failed imports" value={analytics.failedImports} />
        <StatCard icon={Gauge} label="Modules" value={importable.length} />
      </div>

      <Card className="mb-sp-4">
        <CardContent className="p-sp-4">
          <ImportWizard modules={importable} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent imports</CardTitle>
        </CardHeader>
        <CardContent className="p-sp-2">
          {jobs.length === 0 ? (
            <p className="p-sp-2 text-body text-soft">No imports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-caption text-soft">{formatDateTime(j.created_at)}</TableCell>
                    <TableCell className="capitalize">{j.module}</TableCell>
                    <TableCell className="capitalize">{j.mode.replace(/_/g, " ")}</TableCell>
                    <TableCell>{j.imported_rows}/{j.total_rows}</TableCell>
                    <TableCell>
                      <Badge variant={j.status === "completed" ? "success" : j.status === "failed" ? "danger" : "neutral"} className="capitalize">
                        {j.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
