import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Noto_Sans_Devanagari,
} from "next/font/google";

/** Display + headings — Bricolage Grotesque (variable, 800/700) */
export const fontBricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

/** Body — Plus Jakarta Sans */
export const fontJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Nepali — Noto Sans Devanagari */
export const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

/** Convenience: all font CSS-variable classes for the <html> element. */
export const fontVariables = `${fontBricolage.variable} ${fontJakarta.variable} ${fontDevanagari.variable}`;
