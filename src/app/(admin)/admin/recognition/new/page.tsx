import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createProgram } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { ProgramForm } from "@/components/recognition/program-form";

export const metadata: Metadata = {
  title: "New recognition program",
  robots: { index: false, follow: false },
};

export default async function NewProgramPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/recognition");

  return (
    <>
      <PortalPageHeader
        title="New recognition program"
        description="Programs start as drafts — publish to feature winners on the Hall of Fame."
      />
      <Card className="p-sp-4">
        <ProgramForm action={createProgram} submitLabel="Create program" />
      </Card>
    </>
  );
}
