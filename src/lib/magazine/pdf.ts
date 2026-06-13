import "server-only";

/**
 * PDF service abstraction (PART 14).
 *
 * The magazine is architected so an edition or a single article can be rendered
 * to PDF *without any schema change* — the data needed (edition + ordered
 * articles + blocks) is already queryable. This module defines the provider
 * contract and a default "not configured" provider. A real provider (e.g. a
 * serverless Chromium/Playwright render, or a hosted HTML→PDF API) can be
 * dropped in behind `getPdfProvider()` later; nothing else in the app changes.
 */

export interface PdfRequest {
  kind: "edition" | "article";
  id: string;
  title: string;
}

export interface PdfResult {
  ok: boolean;
  /** Public URL of the generated PDF when ok. */
  url?: string;
  /** Human-readable reason when not ok (e.g. provider not configured). */
  reason?: string;
}

export interface PdfProvider {
  readonly name: string;
  readonly available: boolean;
  generate(req: PdfRequest): Promise<PdfResult>;
}

/** Default provider — explicitly unavailable until a real one is wired up. */
const NOOP_PROVIDER: PdfProvider = {
  name: "none",
  available: false,
  async generate() {
    return {
      ok: false,
      reason:
        "PDF generation is not configured. Add a PdfProvider (see docs/phase9.5-magazine.md → Roadmap).",
    };
  },
};

let provider: PdfProvider = NOOP_PROVIDER;

/** Swap in a real provider at boot (e.g. from instrumentation). */
export function registerPdfProvider(p: PdfProvider): void {
  provider = p;
}

export function getPdfProvider(): PdfProvider {
  return provider;
}

export function isPdfAvailable(): boolean {
  return provider.available;
}
