import { ShieldCheck } from "lucide-react";

/** A voter's anonymous receipt — proves they voted, never reveals the choice. */
export function VoteReceipt({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-sp-2 rounded-xl border-2 border-emerald-300 bg-success-bg/40 p-sp-4 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-pill bg-primary text-on-primary">
        <ShieldCheck className="size-6" />
      </span>
      <h3 className="font-heading text-h3 font-bold text-ink">Your vote is recorded</h3>
      <p className="text-body text-soft">
        Keep this receipt code. Your ballot is anonymous — no one can see who you
        voted for.
      </p>
      <p className="rounded-md border border-line bg-surface px-sp-3 py-sp-2 font-mono text-h3 font-bold tracking-widest text-ink">
        {code}
      </p>
    </div>
  );
}
