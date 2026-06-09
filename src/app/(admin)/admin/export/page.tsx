import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { MODULES } from "@/lib/dataio/registry";
import { listExportJobs } from "@/lib/dataio/jobs";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportPanel } from "@/components/dataio/export-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Export data",
  robots: { index: false, follow: false },
};

export default async function ExportPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");

  const exportable = MODULES.filter((m) => m.supportsExport);
  const jobs = await listExportJobs(10);

  return (
    <>
      <PortalPageHeader
        title="Export data"
        description="Download module data as CSV or JSON."
      />

      <div className="mb-sp-4">
        <ExportPanel modules={exportable} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent exports</CardTitle>
        </CardHeader>
        <CardContent className="p-sp-2">
          {jobs.length === 0 ? (
            <p className="p-sp-2 text-body text-soft">No exports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-caption text-soft">{formatDateTime(j.created_at)}</TableCell>
                    <TableCell className="capitalize">{j.module}</TableCell>
                    <TableCell className="uppercase">{j.format}</TableCell>
                    <TableCell>{j.row_count}</TableCell>
                    <TableCell>
                      <Badge variant="success" className="capitalize">{j.status}</Badge>
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
