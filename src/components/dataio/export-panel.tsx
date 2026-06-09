"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { ModuleMeta } from "@/lib/dataio/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function ExportPanel({ modules }: { modules: ModuleMeta[] }) {
  const [moduleKey, setModuleKey] = React.useState(modules[0]?.key ?? "");
  const [format, setFormat] = React.useState<"csv" | "json">("csv");

  const href = `/api/admin/export?module=${encodeURIComponent(moduleKey)}&format=${format}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-sp-3 p-sp-4">
        <div className="grid gap-sp-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-module">Module</Label>
            <select
              id="exp-module"
              value={moduleKey}
              onChange={(e) => setModuleKey(e.target.value)}
              className="h-11 rounded-md border border-line bg-surface px-3 text-body text-ink"
            >
              {modules.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-format">Format</Label>
            <select
              id="exp-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as "csv" | "json")}
              className="h-11 rounded-md border border-line bg-surface px-3 text-body text-ink"
            >
              <option value="csv">CSV (Excel-compatible)</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
        <p className="text-caption text-soft">
          Exports the current data for the selected module. ZIP/PDF, scheduled and
          emailed exports are on the roadmap.
        </p>
        <div>
          <Button asChild variant="primary">
            <a href={href} download>
              <Download className="size-4" /> Download export
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
