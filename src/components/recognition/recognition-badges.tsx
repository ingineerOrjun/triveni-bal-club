import { Globe, Users, Lock } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  AchievementVisibility,
  AwardStatus,
} from "@/types/database";

const VISIBILITY: Record<
  AchievementVisibility,
  { variant: BadgeProps["variant"]; label: string; Icon: typeof Globe }
> = {
  public: { variant: "success", label: "Public", Icon: Globe },
  members: { variant: "soft", label: "Members", Icon: Users },
  private: { variant: "neutral", label: "Private", Icon: Lock },
};

const STATUS: Record<AwardStatus, { variant: BadgeProps["variant"]; label: string }> = {
  awarded: { variant: "success", label: "Awarded" },
  recommended: { variant: "warning", label: "Recommended" },
  rejected: { variant: "danger", label: "Rejected" },
};

export function VisibilityBadge({
  visibility,
}: {
  visibility: AchievementVisibility;
}) {
  const v = VISIBILITY[visibility];
  return (
    <Badge variant={v.variant} className="gap-1">
      <v.Icon className="size-3.5" /> {v.label}
    </Badge>
  );
}

export function AwardStatusBadge({ status }: { status: AwardStatus }) {
  const s = STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
