"use client";

import * as React from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Parse a display value like "120+", "98%", "1,200" into number + affixes. */
function parse(value: string): { target: number; prefix: string; suffix: string } {
  const match = value.match(/^(\D*?)([\d,.]+)(.*)$/);
  if (!match) return { target: NaN, prefix: "", suffix: value };
  return {
    prefix: match[1] ?? "",
    target: Number(match[2].replace(/,/g, "")),
    suffix: match[3] ?? "",
  };
}

/**
 * Counts up to a numeric value the first time it scrolls into view.
 * Non-numeric values (or reduced-motion) render instantly. Pure JS — no deps.
 */
export function AnimatedCounter({
  value,
  durationMs = 1400,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const { target, prefix, suffix } = React.useMemo(() => parse(value), [value]);
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = React.useState<string>(
    Number.isNaN(target) ? value : `${prefix}0${suffix}`
  );

  React.useEffect(() => {
    if (Number.isNaN(target)) {
      setDisplay(value);
      return;
    }
    if (prefersReducedMotion()) {
      setDisplay(`${prefix}${target.toLocaleString()}${suffix}`);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setDisplay(`${prefix}${target.toLocaleString()}${suffix}`);
      return;
    }

    let raf = 0;
    let start = 0;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            raf = requestAnimationFrame(animate);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, prefix, suffix, value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
