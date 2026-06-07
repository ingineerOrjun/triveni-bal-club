import Link from "next/link";
import { Award, Download, ShieldCheck } from "lucide-react";
import type { CertificateRow } from "@/types/database";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CertificateCard({
  certificate,
}: {
  certificate: CertificateRow;
}) {
  return (
    <Card className="flex h-full flex-col gap-2 p-sp-3">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex size-11 items-center justify-center rounded-md bg-accent-soft text-accent-active">
          <Award className="size-5" />
        </span>
        <Badge variant="soft">{certificate.certificate_number}</Badge>
      </div>
      <h3 className="font-heading text-h3 font-bold text-ink">
        {certificate.title}
      </h3>
      <p className="text-caption text-soft">
        Issued {formatDate(certificate.issued_date)}
      </p>
      <div className="mt-auto flex flex-wrap gap-sp-2 pt-sp-1">
        {certificate.pdf_url ? (
          <Button asChild variant="primary" size="sm">
            <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" /> Download PDF
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <Download className="size-4" /> PDF coming soon
          </Button>
        )}
        <Button asChild variant="ghost" size="sm">
          <Link href={`/certificates/verify/${certificate.verification_code}`}>
            <ShieldCheck className="size-4" /> Verify
          </Link>
        </Button>
      </div>
    </Card>
  );
}
