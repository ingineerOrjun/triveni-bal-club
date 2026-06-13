"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Client search box that navigates to /magazine?q=… (server-side search). */
export function MagazineSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);

  return (
    <form
      role="search"
      className="flex w-full max-w-md items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/magazine?q=${encodeURIComponent(q)}` : "/magazine");
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-soft" aria-hidden />
        <Input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search stories…"
          aria-label="Search the magazine"
          className="pl-9"
        />
      </div>
      <Button type="submit" variant="primary">Search</Button>
    </form>
  );
}
