import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { verifyCertificate } from "@/lib/recognition/queries";
import { Button } from "@/components/ui/button";
import { CertificateViewer } from "@/components/recognition/certificate-viewer";

export const metadata: Metadata = createMetadata({
  title: "Verify certificate",
  description: "Verify the authenticity of a Triveni Child Club certificate.",
  path: "/certificates/verify",
});

// Verification depends on the live database lookup.
export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const result = await verifyCertificate(code);

  return (
    <section className="container-page py-sp-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-sp-4">
        {result ? (
          <>
            <div
              role="status"
              className="flex items-center gap-2 rounded-pill border border-success/40 bg-success-bg/50 px-4 py-2 font-heading font-bold text-emerald-700"
            >
              <ShieldCheck className="size-5" /> Valid certificate
            </div>
            <CertificateViewer
              certificateNumber={result.certificate_number}
              title={result.title}
              recipientName={result.recipient_name}
              issuedDate={result.issued_date}
              verificationCode={code}
              verified
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-sp-3 rounded-xl border border-line bg-surface p-sp-5 text-center shadow-sm">
            <span className="inline-flex size-16 items-center justify-center rounded-pill bg-danger-bg text-danger">
              <ShieldX className="size-8" />
            </span>
            <h1 className="text-h2 font-bold text-ink">Certificate not found</h1>
            <p className="max-w-md text-lead text-soft">
              We couldn&apos;t verify a certificate with this code. Please check
              the link and try again.
            </p>
            <Button asChild variant="primary">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
