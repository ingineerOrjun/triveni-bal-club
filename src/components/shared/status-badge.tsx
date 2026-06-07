import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  ContentStatus,
  RegistrationStatus,
  AttendanceStatus,
} from "@/types/database";

const CONTENT: Record<ContentStatus, BadgeProps["variant"]> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

const REGISTRATION: Record<RegistrationStatus, BadgeProps["variant"]> = {
  registered: "success",
  cancelled: "neutral",
  waitlisted: "warning",
};

const ATTENDANCE: Record<AttendanceStatus, BadgeProps["variant"]> = {
  present: "success",
  absent: "danger",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <Badge variant={CONTENT[status]} className="capitalize">
      {status}
    </Badge>
  );
}

export function RegistrationBadge({ status }: { status: RegistrationStatus }) {
  return (
    <Badge variant={REGISTRATION[status]} className="capitalize">
      {status}
    </Badge>
  );
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge variant={ATTENDANCE[status]} className="capitalize">
      {status}
    </Badge>
  );
}
