import type { Metadata } from "next";
import { FileBadge } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listMemberCertificates } from "@/lib/recognition/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { CertificateCard } from "@/components/recognition/certificate-card";
import { CertificateViewer } from "@/components/recognition/certificate-viewer";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "My certificates",
  robots: { index: false, follow: false },
};

export default async function PortalCertificatesPage() {
  const user = await getCurrentUser();
  const certificates = user ? await listMemberCertificates(user.id) : [];
  const latest = certificates[0];

  return (
    <>
      <PortalPageHeader
        title="My certificates"
        description="Download your certificates and share verification links."
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={FileBadge}
          title="No certificates yet"
          description="Certificates issued to you by club admins will appear here."
        />
      ) : (
        <div className="flex flex-col gap-sp-4">
          {latest && user ? (
            <CertificateViewer
              certificateNumber={latest.certificate_number}
              title={latest.title}
              recipientName={user.fullName}
              issuedDate={latest.issued_date}
              verificationCode={latest.verification_code}
            />
          ) : null}
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <CertificateCard key={c.id} certificate={c} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
