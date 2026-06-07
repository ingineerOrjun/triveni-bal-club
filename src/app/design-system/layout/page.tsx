import { DsPageHeader, DsSection } from "../_components/showcase";

const SPACING = [
  ["sp-1", "8px", "0.5rem"],
  ["sp-2", "16px", "1rem"],
  ["sp-3", "24px", "1.5rem"],
  ["sp-4", "32px", "2rem"],
  ["sp-5", "48px", "3rem"],
  ["sp-6", "80px", "5rem"],
] as const;

const RADII = [
  ["sm", "8px", "rounded-sm"],
  ["md", "14px", "rounded-md"],
  ["lg", "22px", "rounded-lg"],
  ["xl", "32px", "rounded-xl"],
  ["pill", "999px", "rounded-pill"],
] as const;

const ELEVATION = [
  ["sm", "shadow-sm", "Subtle lift — cards, inputs"],
  ["md", "shadow-md", "Raised — hover, popovers"],
  ["lg", "shadow-lg", "Floating — dialogs, drawers"],
] as const;

const MOTION = [
  ["Fast", "0.2s", "Hover, focus, taps"],
  ["Base", "0.45s", "Enter/exit, reveals"],
  ["Slow", "0.8s", "Large, deliberate moves"],
] as const;

export default function LayoutPage() {
  return (
    <>
      <DsPageHeader
        title="Layout & Systems"
        lead="Spacing, radius, elevation, and motion. An 8-point spacing rhythm, soft rounded corners, restrained shadows, and calm, purposeful motion."
      />

      {/* SPACING */}
      <DsSection
        title="Spacing"
        description="8-point scale. Use via utilities like p-sp-3, gap-sp-2, m-sp-5."
      >
        <div className="flex flex-col gap-sp-2 rounded-lg border border-line bg-surface p-sp-3 shadow-sm">
          {SPACING.map(([token, px, rem]) => (
            <div key={token} className="flex items-center gap-sp-3">
              <code className="w-16 shrink-0 text-caption text-ink">{token}</code>
              <span className="w-20 shrink-0 text-caption text-soft">
                {px} · {rem}
              </span>
              <div
                className="h-4 rounded-sm bg-primary"
                style={{ width: `var(--${token})` }}
              />
            </div>
          ))}
        </div>
      </DsSection>

      {/* RADIUS */}
      <DsSection
        title="Radius"
        description="Soft, friendly corners scaled to component size."
      >
        <div className="flex flex-wrap gap-sp-3">
          {RADII.map(([name, px, util]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="size-24 border border-line-strong bg-primary-soft"
                style={{ borderRadius: `var(--radius-${name})` }}
              />
              <div className="text-center">
                <p className="text-caption font-semibold text-ink">{name}</p>
                <p className="text-[0.7rem] text-soft">{px}</p>
                <code className="text-[0.7rem] text-soft">{util}</code>
              </div>
            </div>
          ))}
        </div>
      </DsSection>

      {/* ELEVATION */}
      <DsSection
        title="Elevation"
        description="Three subtle, navy-tinted shadow steps. No heavy glassmorphism."
      >
        <div className="grid gap-sp-4 sm:grid-cols-3">
          {ELEVATION.map(([name, util, use]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="flex size-28 items-center justify-center rounded-lg bg-surface"
                style={{ boxShadow: `var(--shadow-${name})` }}
              >
                <code className="text-caption text-soft">{util}</code>
              </div>
              <p className="text-caption text-soft">{use}</p>
            </div>
          ))}
        </div>
      </DsSection>

      {/* MOTION */}
      <DsSection
        title="Motion"
        description="Easing cubic-bezier(.22,1,.36,1). Hover the cards. Honors prefers-reduced-motion."
      >
        <div className="grid gap-sp-3 sm:grid-cols-3">
          {MOTION.map(([name, dur, use]) => (
            <div
              key={name}
              className="group flex flex-col gap-2 rounded-lg border border-line bg-surface p-sp-3 shadow-sm"
            >
              <div className="overflow-hidden rounded-md bg-background-subtle">
                <div
                  className="h-3 w-1/4 rounded-pill bg-accent transition-[width] ease-out group-hover:w-full"
                  style={{ transitionDuration: dur }}
                />
              </div>
              <p className="font-heading font-bold text-ink">
                {name}{" "}
                <span className="font-body text-caption font-normal text-soft">
                  {dur}
                </span>
              </p>
              <p className="text-caption text-soft">{use}</p>
            </div>
          ))}
        </div>
      </DsSection>

      {/* CONTAINER */}
      <DsSection
        title="Container & grid"
        description="Page content centers within a max width with responsive gutters."
      >
        <div className="rounded-lg border border-dashed border-line-strong bg-background-subtle p-sp-2">
          <div className="rounded-md bg-surface p-sp-3 shadow-sm">
            <p className="text-caption text-soft">
              <code>.container-page</code> — max-width 80rem (1280px), centered,
              gutter sp-2 → sp-4.
            </p>
            <div className="mt-sp-2 grid grid-cols-2 gap-sp-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-16 items-center justify-center rounded-sm bg-primary-soft text-caption font-semibold text-primary-active"
                >
                  col {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DsSection>
    </>
  );
}
