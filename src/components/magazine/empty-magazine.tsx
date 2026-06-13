import { Newspaper } from "lucide-react";
import { EmptyState, type EmptyStateProps } from "@/components/shared/empty-state";

/** Magazine-flavoured empty state used across reading + editorial screens. */
export function EmptyMagazine(props: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Newspaper}
      title={props.title ?? "No stories yet"}
      description={
        props.description ??
        "Once articles are written and published they'll appear here."
      }
      action={props.action}
      className={props.className}
    />
  );
}
