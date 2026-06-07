import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import type { SuggestionListItem } from "@/lib/suggestions/queries";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SuggestionStatusBadge,
  SuggestionPriorityBadge,
} from "@/components/suggestions/suggestion-status-badge";

/** Admin/moderator table view. Staff always see the real author. */
export function SuggestionTable({ items }: { items: SuggestionListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-right">Support</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-semibold">
              <Link
                href={`/admin/suggestions/${s.id}`}
                className="rounded-sm hover:text-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s.title}
              </Link>
            </TableCell>
            <TableCell className="text-soft">
              {s.author?.full_name ?? "—"}
              {s.is_anonymous ? (
                <span className="ml-1 text-caption">(anon)</span>
              ) : null}
            </TableCell>
            <TableCell className="text-soft">{s.category?.name ?? "—"}</TableCell>
            <TableCell>
              <SuggestionStatusBadge status={s.status} />
            </TableCell>
            <TableCell>
              <SuggestionPriorityBadge priority={s.priority} />
            </TableCell>
            <TableCell className="text-right">
              <span className="inline-flex items-center gap-1 text-soft">
                <ThumbsUp className="size-3.5" /> {s.support_count}
              </span>
            </TableCell>
            <TableCell className="text-caption text-soft">
              {formatDate(s.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
