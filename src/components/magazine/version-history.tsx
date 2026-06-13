import { History, RotateCcw } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { MagazineArticleVersionRow } from "@/types/database";
import { restoreVersion } from "@/lib/magazine/actions";
import { ActionButton } from "@/components/shared/action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function snapTitle(snapshot: Record<string, unknown>): string {
  const t = snapshot.title;
  return typeof t === "string" && t ? t : "Untitled";
}
function blockCount(snapshot: Record<string, unknown>): number {
  return Array.isArray(snapshot.blocks) ? (snapshot.blocks as unknown[]).length : 0;
}

/** Snapshot list with one-click restore (PART 6). */
export function VersionHistory({
  articleId,
  versions,
}: {
  articleId: string;
  versions: MagazineArticleVersionRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-primary-active" /> Version history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-body text-soft">No saved versions yet. Each save creates a snapshot.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {versions.map((v, i) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-center gap-2">
                  <Badge variant={i === 0 ? "success" : "neutral"}>v{v.version}</Badge>
                  <span className="text-body">
                    <span className="font-semibold text-ink">{snapTitle(v.snapshot)}</span>{" "}
                    <span className="text-soft">· {blockCount(v.snapshot)} blocks · {formatDateTime(v.created_at)}</span>
                  </span>
                </span>
                {i === 0 ? (
                  <Badge variant="soft">Current</Badge>
                ) : (
                  <ActionButton
                    action={restoreVersion.bind(null, articleId, v.id)}
                    variant="outline"
                    confirmMessage={`Restore version ${v.version}? Current content will be snapshotted first.`}
                  >
                    <RotateCcw className="size-4" /> Restore
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
