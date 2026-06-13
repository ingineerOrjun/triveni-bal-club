"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Global toast framework (Phase 14, PART 12). Dependency-free: a context
 * provider holds a queue; <Toaster/> portals to <body> and auto-dismisses each
 * toast. Supports success/error/warning/info, an optional action (e.g. Undo),
 * and a progress bar. Motion respects prefers-reduced-motion via CSS.
 *
 * Usage (client components only):
 *   const { toast } = useToast();
 *   toast({ title: "Saved", variant: "success" });
 */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends Required<Omit<ToastOptions, "action" | "description">> {
  id: number;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Safe no-op fallback so a stray call never crashes a tree without provider.
    return { toast: () => {}, dismiss: () => {} };
  }
  return ctx;
}

const VARIANT_META: Record<
  ToastVariant,
  { icon: typeof Info; ring: string; bar: string; tint: string }
> = {
  success: { icon: CheckCircle2, ring: "border-success/40", bar: "bg-success", tint: "text-success" },
  error: { icon: AlertCircle, ring: "border-danger/40", bar: "bg-danger", tint: "text-danger" },
  warning: { icon: AlertTriangle, ring: "border-warning/40", bar: "bg-warning", tint: "text-warning" },
  info: { icon: Info, ring: "border-info/40", bar: "bg-info", tint: "text-info" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const counter = React.useRef(0);

  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((opts: ToastOptions) => {
    counter.current += 1;
    const id = counter.current;
    const record: ToastRecord = {
      id,
      title: opts.title,
      description: opts.description,
      variant: opts.variant ?? "info",
      durationMs: opts.durationMs ?? 4500,
      action: opts.action,
    };
    setToasts((prev) => [...prev.slice(-3), record]); // cap visible queue
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-sp-3 sm:items-end"
              role="region"
              aria-label="Notifications"
            >
              {toasts.map((t) => (
                <ToastItem key={t.id} record={t} onDismiss={() => dismiss(t.id)} />
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastItem({ record, onDismiss }: { record: ToastRecord; onDismiss: () => void }) {
  const meta = VARIANT_META[record.variant];
  const Icon = meta.icon;

  React.useEffect(() => {
    const t = setTimeout(onDismiss, record.durationMs);
    return () => clearTimeout(t);
  }, [record.durationMs, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border bg-surface p-sp-3 shadow-xl animate-slide-up",
        meta.ring
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", meta.tint)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-body font-bold text-ink">{record.title}</p>
          {record.description ? (
            <p className="mt-0.5 text-caption text-soft">{record.description}</p>
          ) : null}
          {record.action ? (
            <button
              type="button"
              onClick={() => {
                record.action?.onClick();
                onDismiss();
              }}
              className="mt-sp-1 text-caption font-bold text-secondary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {record.action.label}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-button text-soft hover:bg-background-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
      {/* Progress bar */}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-0.5 origin-left motion-safe:animate-[toast-progress_var(--toast-duration)_linear_forwards]", meta.bar)}
        style={{ ["--toast-duration" as string]: `${record.durationMs}ms` }}
      />
    </div>
  );
}
