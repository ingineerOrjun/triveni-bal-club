import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Activity as ActivityIcon,
  CalendarCheck,
  BadgeCheck,
  Award,
  FileBadge,
  Lightbulb,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberDetail } from "@/lib/admin/members";
import { setMemberRole, setMemberActive } from "@/lib/admin/actions";
import { roleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/shared/action-button";

export const metadata: Metadata = {
  title: "Member",
  robots: { index: false, follow: false },
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getCurrentUser();
  if (viewer?.role !== "admin") redirect("/admin");
  const { id } = await params;
  const m = await getMemberDetail(id);
  if (!m) notFound();

  const isSelf = viewer.id === m.id;
  const stats = [
    { icon: ActivityIcon, label: "Activities joined", value: m.participation.activities },
    { icon: CalendarCheck, label: "Events attended", value: m.participation.eventsAttended },
    { icon: BadgeCheck, label: "Badges", value: m.recognition.badges },
    { icon: Award, label: "Achievements", value: m.recognition.achievements },
    { icon: FileBadge, label: "Certificates", value: m.recognition.certificates },
    { icon: Lightbulb, label: "Suggestions", value: m.suggestions },
  ];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/members">
          <ArrowLeft className="size-4" /> All members
        </Link>
      </Button>

      <PortalPageHeader
        title={m.full_name}
        description={m.email}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={m.is_active ? "success" : "neutral"}>
              {m.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="soft">{roleLabel(m.role)}</Badge>
          </div>
        }
      />

      <div className="grid gap-sp-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-sp-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-sp-3 text-body">
                <div>
                  <dt className="text-caption text-soft">Class</dt>
                  <dd className="font-semibold text-ink">
                    {m.classLevel ?? "—"}
                    {m.section ? ` · ${m.section}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-soft">Membership</dt>
                  <dd className="font-semibold capitalize text-ink">
                    {m.membershipStatus ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-soft">Joined</dt>
                  <dd className="font-semibold text-ink">
                    {m.joinedOn ? formatDate(m.joinedOn) : formatDate(m.created_at)}
                  </dd>
                </div>
              </dl>
              {m.bio ? (
                <p className="mt-sp-3 whitespace-pre-line text-body text-soft">
                  {m.bio}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity across the club</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                      <s.icon className="size-4" />
                    </span>
                    <span className="font-display text-h3 font-extrabold text-ink">
                      {s.value}
                    </span>
                    <span className="text-caption text-soft">{s.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-sp-3">
              {isSelf ? (
                <p className="text-caption text-soft">
                  You can&apos;t change your own role or status here.
                </p>
              ) : (
                <>
                  <div>
                    <p className="mb-1.5 text-caption font-semibold text-soft">Role</p>
                    <div className="flex flex-wrap gap-1">
                      {(["member", "moderator", "admin"] as const).map((r) => (
                        <ActionButton
                          key={r}
                          action={setMemberRole.bind(null, m.id, r)}
                          variant={m.role === r ? "primary" : "outline"}
                        >
                          {roleLabel(r)}
                        </ActionButton>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-caption font-semibold text-soft">Status</p>
                    {m.is_active ? (
                      <ActionButton
                        action={setMemberActive.bind(null, m.id, false)}
                        variant="outline"
                        confirmMessage={`Deactivate ${m.full_name}?`}
                      >
                        Deactivate account
                      </ActionButton>
                    ) : (
                      <ActionButton
                        action={setMemberActive.bind(null, m.id, true)}
                        variant="primary"
                      >
                        Activate account
                      </ActionButton>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
