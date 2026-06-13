"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Friendly, recoverable error state for route error boundaries.
 * Logs the technical error to the console for diagnostics; shows the user a
 * calm message with a retry path — never a blank screen.
 */
export function ErrorState({
  error,
  reset,
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  React.useEffect(() => {
    console.error("[route-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-sp-3 px-sp-3 py-sp-6 text-center">
      {/* Illustration */}
      <div aria-hidden className="relative mb-sp-1 grid place-items-center">
        <span className="absolute size-32 rounded-pill bg-gradient-gold-orange opacity-10 blur-2xl" />
        <span className="absolute size-24 rounded-pill border border-line" />
        <span className="relative inline-flex size-16 items-center justify-center rounded-pill bg-warning-bg text-gold-700 shadow-sm">
          <AlertTriangle className="size-8" />
        </span>
      </div>
      <h1 className="text-h2 font-bold text-ink">Something went wrong</h1>
      <p className="max-w-md text-body text-soft">
        An unexpected error occurred while loading this page. Your data is safe —
        try again, or head back home.
        {error.digest ? (
          <span className="mt-1 block text-caption text-soft">Reference: {error.digest}</span>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" onClick={reset}>
          <RotateCcw className="size-4" /> Try again
        </Button>
        <Button asChild variant="outline">
          <a href={homeHref}><Home className="size-4" /> Go home</a>
        </Button>
      </div>
      <a href="/contact" className="text-caption font-semibold text-secondary underline-offset-4 hover:underline">
        Contact support
      </a>
    </div>
  );
}
