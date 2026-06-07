import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  href?: string;
  accent?: "primary" | "accent";
}

export function StatCard({
  icon: Icon,
  label,
  value,
  href,
  accent = "primary",
}: StatCardProps) {
  const inner = (
    <Card interactive={Boolean(href)} className="h-full">
      <CardContent className="flex items-center gap-sp-3 p-sp-3">
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-md",
            accent === "primary"
              ? "bg-primary-soft text-primary-active"
              : "bg-accent-soft text-accent-active"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-h2 font-extrabold leading-none text-ink">
            {value}
          </p>
          <p className="mt-1 truncate text-caption text-soft">{label}</p>
        </div>
        {href ? <ArrowUpRight className="ml-auto size-4 text-soft" /> : null}
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {inner}
    </Link>
  ) : (
    inner
  );
}
