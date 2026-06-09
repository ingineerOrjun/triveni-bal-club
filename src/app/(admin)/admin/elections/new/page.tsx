import type { Metadata } from "next";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { CreateElectionForm } from "@/components/elections/admin-forms";

export const metadata: Metadata = { title: "New election", robots: { index: false, follow: false } };

export default function NewElectionPage() {
  return (
    <>
      <PortalPageHeader
        title="New election"
        description="Create the election, then add positions and open nominations."
      />
      <Card className="p-sp-4">
        <CreateElectionForm />
      </Card>
    </>
  );
}
