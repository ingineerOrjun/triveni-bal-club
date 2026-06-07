"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { SuggestionCategoryRow, TagRow } from "@/types/database";
import { SUGGESTION_STATUSES } from "@/lib/suggestions/schema";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ALL = "all";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "supported", label: "Most supported" },
  { value: "updated", label: "Recently updated" },
] as const;

export function SuggestionFilters({
  categories,
  tags,
  showStatus = true,
  showPriority = false,
}: {
  categories: SuggestionCategoryRow[];
  tags: TagRow[];
  showStatus?: boolean;
  showPriority?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasFilters = ["category", "status", "priority", "tag", "sort", "q"].some(
    (k) => params.get(k)
  );

  return (
    <div className="flex flex-wrap items-end gap-sp-2">
      <FilterSelect
        id="f-category"
        label="Category"
        value={params.get("category") ?? ALL}
        onChange={(v) => setParam("category", v)}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      {showStatus ? (
        <FilterSelect
          id="f-status"
          label="Status"
          value={params.get("status") ?? ALL}
          onChange={(v) => setParam("status", v)}
          options={SUGGESTION_STATUSES.map((s) => ({
            value: s,
            label: s.replace(/_/g, " "),
          }))}
        />
      ) : null}
      {showPriority ? (
        <FilterSelect
          id="f-priority"
          label="Priority"
          value={params.get("priority") ?? ALL}
          onChange={(v) => setParam("priority", v)}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
      ) : null}
      <FilterSelect
        id="f-tag"
        label="Tag"
        value={params.get("tag") ?? ALL}
        onChange={(v) => setParam("tag", v)}
        options={tags.map((t) => ({ value: t.id, label: t.name }))}
      />
      <FilterSelect
        id="f-sort"
        label="Sort"
        value={params.get("sort") ?? "newest"}
        onChange={(v) => setParam("sort", v)}
        options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
        includeAll={false}
      />
      {hasFilters ? (
        <Button variant="ghost" onClick={() => router.push(pathname)}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  includeAll = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  includeAll?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-caption">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-40 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeAll ? <SelectItem value={ALL}>All</SelectItem> : null}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="capitalize">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
