import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requirePortalAccess } from "@/lib/auth/session";
import { getContributorForUser } from "@/lib/contributors/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { ContributorProfileForm } from "@/components/contributors/profile-form";

export const metadata: Metadata = { title: "My author profile" };
export const dynamic = "force-dynamic";

export default async function MyAuthorProfilePage() {
  const user = await requirePortalAccess("/portal/magazine/profile");
  const contributor = await getContributorForUser(user.id);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/portal/magazine"><ArrowLeft className="size-4" /> My magazine</Link>
      </Button>
      <PortalPageHeader
        title="My author profile"
        description="This is your public byline and portfolio — readers see it on every article you publish."
        action={
          contributor ? (
            <Button asChild variant="outline">
              <Link href={`/authors/${contributor.slug}`} target="_blank">
                <ExternalLink className="size-4" /> View public profile
              </Link>
            </Button>
          ) : undefined
        }
      />
      <ContributorProfileForm contributor={contributor} />
    </>
  );
}
