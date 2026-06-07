import { Check, X } from "lucide-react";
import { DsPageHeader, DsSection, Swatch } from "../_components/showcase";

const NAVY = [
  ["Navy 900", "#0B1120", "--navy-900"],
  ["Navy 800", "#0F172A", "--navy-800"],
  ["Navy 700", "#1E293B", "--navy-700"],
  ["Navy 600", "#334155", "--navy-600"],
  ["Navy 500", "#475569", "--navy-500"],
  ["Navy 400", "#64748B", "--navy-400"],
] as const;

const EMERALD = [
  ["Emerald 700", "#047857", "--emerald-700"],
  ["Emerald 600", "#059669", "--emerald-600"],
  ["Emerald 500", "#10B981", "--emerald-500"],
  ["Emerald 400", "#34D399", "--emerald-400"],
  ["Emerald 300", "#6EE7B7", "--emerald-300"],
  ["Emerald 100", "#D1FAE5", "--emerald-100"],
] as const;

const GOLD = [
  ["Gold 700", "#B45309", "--gold-700"],
  ["Gold 600", "#D97706", "--gold-600"],
  ["Gold 500", "#F59E0B", "--gold-500"],
  ["Gold 400", "#FBBF24", "--gold-400"],
  ["Gold 300", "#FCD34D", "--gold-300"],
  ["Gold 100", "#FEF3C7", "--gold-100"],
] as const;

const SLATE = [
  ["Slate 50", "#F8FAFC", "--slate-50"],
  ["Slate 100", "#F1F5F9", "--slate-100"],
  ["Slate 200", "#E2E8F0", "--slate-200"],
  ["Slate 300", "#CBD5E1", "--slate-300"],
  ["Slate 400", "#94A3B8", "--slate-400"],
  ["Slate 600", "#475569", "--slate-600"],
] as const;

const SEMANTIC = [
  ["Background", "--bg", "Page background", false],
  ["Surface", "--surface", "Cards & panels", false],
  ["Ink", "--ink", "Primary text", true],
  ["Soft", "--soft", "Secondary text", true],
  ["Primary", "--primary", "Primary actions (emerald)", false],
  ["Accent", "--accent", "Highlights (gold)", false],
  ["Line", "--line", "Borders & dividers", false],
] as const;

function isDark(name: string) {
  return /900|800|700|600|500/.test(name) && !/Slate (50|100|200|300)/.test(name);
}

function Palette({
  title,
  colors,
}: {
  title: string;
  colors: readonly (readonly [string, string, string])[];
}) {
  return (
    <DsSection title={title}>
      <div className="grid grid-cols-2 gap-sp-2 sm:grid-cols-3 lg:grid-cols-6">
        {colors.map(([name, value, varName]) => (
          <Swatch
            key={varName}
            name={name}
            value={value}
            varName={varName}
            ink={isDark(name) ? "dark" : "light"}
          />
        ))}
      </div>
    </DsSection>
  );
}

export default function ColorsPage() {
  return (
    <>
      <DsPageHeader
        title="Colors"
        lead="Four families — Navy for structure, Emerald for action, Gold for recognition, Slate for neutrals. Components consume semantic tokens, never raw hex values."
      />

      <Palette title="Navy" colors={NAVY} />
      <Palette title="Emerald" colors={EMERALD} />
      <Palette title="Gold" colors={GOLD} />
      <Palette title="Slate" colors={SLATE} />

      <DsSection
        title="Semantic tokens"
        description="The aliases components actually use. Re-point these to add themes."
      >
        <div className="grid grid-cols-1 gap-sp-2 sm:grid-cols-2 lg:grid-cols-4">
          {SEMANTIC.map(([name, varName, use, darkText]) => (
            <div
              key={varName}
              className="overflow-hidden rounded-md border border-line bg-surface shadow-sm"
            >
              <div
                className="flex h-16 items-end p-2"
                style={{ backgroundColor: `var(${varName})` }}
              >
                <span
                  className="rounded-sm px-1.5 py-0.5 text-caption font-semibold"
                  style={{ color: darkText ? "#fff" : "#0F172A" }}
                >
                  {varName}
                </span>
              </div>
              <div className="p-2">
                <p className="text-caption font-semibold text-ink">{name}</p>
                <p className="text-[0.7rem] text-soft">{use}</p>
              </div>
            </div>
          ))}
        </div>
      </DsSection>

      {/* ===================== ACCESSIBILITY CONTRACT ===================== */}
      <DsSection
        title="Accessibility contract"
        description="Mandatory contrast rules. The system encodes these in tokens (on-primary / on-accent are always Navy 800)."
      >
        <div className="grid gap-sp-3 sm:grid-cols-2">
          {/* DO */}
          <div className="rounded-lg border border-success/40 bg-success-bg/40 p-sp-3">
            <p className="mb-sp-2 inline-flex items-center gap-2 font-heading font-bold text-emerald-700">
              <Check className="size-5" /> Do
            </p>
            <div className="flex flex-col gap-sp-2">
              <div className="flex items-center justify-center rounded-md bg-emerald-500 px-4 py-3 font-semibold text-navy-800">
                Navy 800 on Emerald
              </div>
              <div className="flex items-center justify-center rounded-md bg-gold-500 px-4 py-3 font-semibold text-navy-800">
                Navy 800 on Gold
              </div>
              <div className="flex items-center justify-center rounded-md bg-navy-800 px-4 py-3 font-semibold text-white">
                White on Navy
              </div>
            </div>
          </div>

          {/* DON'T */}
          <div className="rounded-lg border border-danger/40 bg-danger-bg/40 p-sp-3">
            <p className="mb-sp-2 inline-flex items-center gap-2 font-heading font-bold text-danger">
              <X className="size-5" /> Never
            </p>
            <div className="flex flex-col gap-sp-2">
              <div className="relative flex items-center justify-center rounded-md bg-emerald-500 px-4 py-3 font-semibold text-white line-through decoration-danger decoration-2">
                White on Emerald
              </div>
              <div className="relative flex items-center justify-center rounded-md bg-gold-500 px-4 py-3 font-semibold text-white line-through decoration-danger decoration-2">
                White on Gold
              </div>
              <p className="text-caption text-soft">
                Low contrast — fails WCAG AA and breaks the brand rule.
              </p>
            </div>
          </div>
        </div>
      </DsSection>
    </>
  );
}
