import { Award, BadgeCheck, ShieldCheck } from "lucide-react";
import { formatDateLong } from "@/lib/format";
import { SITE } from "@/content/site";

export interface CertificateViewerProps {
  certificateNumber: string;
  title: string;
  recipientName: string;
  issuedDate: string;
  verificationCode?: string;
  verified?: boolean;
}

/** A framed, printable certificate rendering (used on verify + member pages). */
export function CertificateViewer({
  certificateNumber,
  title,
  recipientName,
  issuedDate,
  verificationCode,
  verified,
}: CertificateViewerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-4 border-gold-300 bg-surface p-sp-4 shadow-lg sm:p-sp-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--gold-100)_0%,transparent_70%)]"
      />
      <div className="flex flex-col items-center gap-sp-2 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-pill bg-accent text-on-accent">
          <Award className="size-7" />
        </span>
        <p className="font-heading text-caption font-bold uppercase tracking-wide text-soft">
          Certificate of Recognition
        </p>
        <p className="text-body text-soft">This certifies that</p>
        <p className="font-display text-h1 font-extrabold text-ink">
          {recipientName}
        </p>
        <p className="max-w-prose text-lead text-soft">{title}</p>

        <div className="mt-sp-3 flex w-full flex-col items-center gap-1 border-t border-line pt-sp-3 text-caption text-soft sm:flex-row sm:justify-between">
          <span>
            {SITE.name} · {SITE.school}
          </span>
          <span>Issued {formatDateLong(issuedDate)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-sp-3 gap-y-1 text-caption text-soft">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-4 text-primary-active" /> No.{" "}
            {certificateNumber}
          </span>
          {verificationCode ? (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary-active" /> Code:{" "}
              {verificationCode}
            </span>
          ) : null}
          {verified ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <ShieldCheck className="size-4" /> Verified
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
