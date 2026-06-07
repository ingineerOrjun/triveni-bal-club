import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listMemberOptions } from "@/lib/recognition/queries";
import { issueCertificate } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { CertificateForm } from "@/components/recognition/certificate-form";

export const metadata: Metadata = {
  title: "Issue certificate",
  robots: { index: false, follow: false },
};

export default async function NewCertificatePage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/certificates");

  const members = await listMemberOptions();

  return (
    <>
      <PortalPageHeader
        title="Issue certificate"
        description="Generate a verifiable certificate for a member."
      />
      <Card className="p-sp-4">
        <CertificateForm action={issueCertificate} members={members} />
      </Card>
    </>
  );
}
