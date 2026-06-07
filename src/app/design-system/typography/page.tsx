import { DsPageHeader, DsSection } from "../_components/showcase";

const SCALE = [
  {
    name: "Display",
    cls: "text-display font-display font-extrabold",
    spec: "Bricolage Grotesque 800 · clamp(2.75rem → 5rem)",
    sample: "Students lead the way",
  },
  {
    name: "H1",
    cls: "text-h1 font-heading font-bold",
    spec: "Bricolage Grotesque 700 · clamp(2.25rem → 3.5rem)",
    sample: "Activities & Events",
  },
  {
    name: "H2",
    cls: "text-h2 font-heading font-bold",
    spec: "Bricolage Grotesque 700 · clamp(1.75rem → 2.5rem)",
    sample: "Upcoming this term",
  },
  {
    name: "H3",
    cls: "text-h3 font-heading font-bold",
    spec: "Bricolage Grotesque 700 · clamp(1.375rem → 1.75rem)",
    sample: "Club committee",
  },
  {
    name: "Lead",
    cls: "text-lead text-soft",
    spec: "Plus Jakarta Sans · clamp(1.125rem → 1.375rem)",
    sample: "An introductory paragraph that sets the tone for a section.",
  },
  {
    name: "Body",
    cls: "text-body",
    spec: "Plus Jakarta Sans · clamp(1rem → 1.0625rem)",
    sample:
      "Body copy for the bulk of the portal. Comfortable line length and rhythm keep reading effortless.",
  },
  {
    name: "Caption",
    cls: "text-caption text-soft",
    spec: "Plus Jakarta Sans · 0.875rem",
    sample: "Metadata, labels, and helper text.",
  },
] as const;

export default function TypographyPage() {
  return (
    <>
      <DsPageHeader
        title="Typography"
        lead="A fluid, clamp()-based scale. Bricolage Grotesque for display & headings, Plus Jakarta Sans for body, Noto Sans Devanagari for Nepali."
      />

      <DsSection
        title="Type scale"
        description="Resize the window — every step scales fluidly between its min and max."
      >
        <div className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface shadow-sm">
          {SCALE.map((s) => (
            <div
              key={s.name}
              className="grid gap-2 p-sp-3 sm:grid-cols-[120px_1fr]"
            >
              <div className="flex flex-col">
                <span className="font-heading font-bold text-ink">{s.name}</span>
                <span className="text-[0.7rem] text-soft">{s.spec}</span>
              </div>
              <p className={s.cls}>{s.sample}</p>
            </div>
          ))}
        </div>
      </DsSection>

      <DsSection
        title="Font families"
        description="Three typefaces cover the portal's bilingual needs."
      >
        <div className="grid gap-sp-3 md:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-sp-3 shadow-sm">
            <p className="text-caption font-semibold text-soft">Display / Headings</p>
            <p className="font-display text-h2 font-extrabold text-ink">
              Bricolage
            </p>
            <p className="mt-1 text-caption text-soft">Bricolage Grotesque</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-sp-3 shadow-sm">
            <p className="text-caption font-semibold text-soft">Body</p>
            <p className="font-body text-h2 font-semibold text-ink">Jakarta</p>
            <p className="mt-1 text-caption text-soft">Plus Jakarta Sans</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-sp-3 shadow-sm">
            <p className="text-caption font-semibold text-soft">Nepali</p>
            <p lang="ne" className="font-nepali text-h2 font-semibold text-ink">
              त्रिवेणी
            </p>
            <p className="mt-1 text-caption text-soft">Noto Sans Devanagari</p>
          </div>
        </div>
      </DsSection>

      <DsSection
        title="Bilingual sample"
        description="English and Nepali sit together without layout breaks."
      >
        <div className="rounded-lg border border-line bg-surface p-sp-4 shadow-sm">
          <h3 className="text-h3 font-bold text-ink">Welcome to the Club</h3>
          <p className="mt-1 text-body text-soft">
            Join activities, vote in elections, and share your voice.
          </p>
          <h3 lang="ne" className="mt-sp-3 font-nepali text-h3 font-bold text-ink">
            क्लबमा स्वागत छ
          </h3>
          <p lang="ne" className="mt-1 font-nepali text-body text-soft">
            गतिविधिमा सहभागी हुनुहोस्, निर्वाचनमा मतदान गर्नुहोस्।
          </p>
        </div>
      </DsSection>
    </>
  );
}
