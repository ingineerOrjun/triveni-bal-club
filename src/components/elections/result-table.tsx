import { Trophy } from "lucide-react";
import type { PositionResult } from "@/lib/elections/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart } from "@/components/admin/bar-chart";

/** Per-position results with winner highlight + a turnout bar chart. */
export function ResultTable({ result }: { result: PositionResult }) {
  const total = result.rows.reduce((n, r) => n + r.votes, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{result.position.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-sp-3">
        <BarChart
          data={result.rows.map((r) => ({ label: r.candidate.memberName ?? "—", value: r.votes }))}
          accent="accent"
        />
        <ul className="flex flex-col divide-y divide-line">
          {result.rows.map((r) => {
            const isWinner = result.winnerIds.includes(r.candidate.id);
            const pct = total > 0 ? Math.round((r.votes / total) * 100) : 0;
            return (
              <li key={r.candidate.id} className="flex items-center justify-between gap-2 py-2">
                <span className="inline-flex items-center gap-2 font-semibold text-ink">
                  {isWinner ? <Trophy className="size-4 text-accent" /> : null}
                  {r.candidate.memberName ?? "Candidate"}
                  {isWinner ? <Badge variant="success">Winner</Badge> : null}
                </span>
                <span className="text-caption text-soft">
                  {r.votes} votes · {pct}%
                </span>
              </li>
            );
          })}
          {result.rows.length === 0 ? (
            <li className="py-2 text-body text-soft">No candidates.</li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
