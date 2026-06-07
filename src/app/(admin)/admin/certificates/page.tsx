import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2, FileBadge, ShieldCheck } from "lucide-react";
import { listAllCertificates } from "@/lib/recognition/queries";
import { deleteCertificate } from "@/lib/recognition/actions";
import { formatDate } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Manage certificates",
  robots: { index: false, follow: false },
};

export default async function AdminCertificatesPage() {
  const certificates = await listAllCertificates();

  return (
    <>
      <PortalPageHeader
        title="Certificates"
        description="Issue and manage member certificates. Only admins can issue."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/certificates/new">
              <Plus className="size-4" /> Issue certificate
            </Link>
          </Button>
        }
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={FileBadge}
          title="No certificates issued"
          description="Issue your first certificate to a member."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-caption">
                  {c.certificate_number}
                </TableCell>
                <TableCell className="font-semibold">{c.title}</TableCell>
                <TableCell>{c.recipient?.full_name ?? "—"}</TableCell>
                <TableCell className="text-caption text-soft">
                  {formatDate(c.issued_date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/certificates/verify/${c.verification_code}`}
                        target="_blank"
                      >
                        <ShieldCheck className="size-4" /> Verify
                      </Link>
                    </Button>
                    <ActionButton
                      action={deleteCertificate.bind(null, c.id)}
                      variant="ghost"
                      confirmMessage={`Delete certificate ${c.certificate_number}?`}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </ActionButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
