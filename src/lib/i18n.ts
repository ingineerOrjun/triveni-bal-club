/**
 * Lightweight bilingual helper.
 *
 * Content is authored as { en, ne? } pairs (see content/types.ts). Components
 * call `localize()` to resolve a string for the active locale, falling back to
 * English. When Supabase + a locale switcher arrive later, only the `locale`
 * source changes — call sites stay identical.
 */

export type Locale = "en" | "ne";

export const DEFAULT_LOCALE: Locale = "en";

export interface LocalizedText {
  en: string;
  ne?: string;
}

/** Resolve a localized string, falling back to English. */
export function localize(
  text: LocalizedText | string,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (typeof text === "string") return text;
  if (locale === "ne") return text.ne?.trim() ? text.ne : text.en;
  return text.en;
}

/** True when a Nepali translation exists. */
export function hasNepali(text: LocalizedText): boolean {
  return Boolean(text.ne && text.ne.trim().length > 0);
}
