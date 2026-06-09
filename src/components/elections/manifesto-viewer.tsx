import { ScrollText, Eye, Target } from "lucide-react";
import type { CandidateView } from "@/lib/elections/queries";

/** Renders a candidate's manifesto, vision, and goals. */
export function ManifestoViewer({ candidate }: { candidate: CandidateView }) {
  const sections = [
    { icon: ScrollText, title: "Manifesto", body: candidate.manifesto },
    { icon: Eye, title: "Vision", body: candidate.vision },
    { icon: Target, title: "Goals", body: candidate.goals },
  ].filter((s) => s.body);

  if (sections.length === 0) {
    return <p className="text-body text-soft">No manifesto provided.</p>;
  }
  return (
    <div className="flex flex-col gap-sp-3">
      {sections.map((s) => (
        <div key={s.title}>
          <h4 className="inline-flex items-center gap-2 font-heading text-body font-bold text-ink">
            <s.icon className="size-4 text-primary-active" /> {s.title}
          </h4>
          <p className="mt-1 whitespace-pre-line text-body text-soft">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
