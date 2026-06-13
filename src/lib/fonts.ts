import {
  Bricolage_Grotesque,
  Space_Grotesk,
  Plus_Jakarta_Sans,
  Inter,
  Noto_Sans_Devanagari,
} from "next/font/google";

/** Headings — Bricolage Grotesque (variable, 400–800) */
export const fontBricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

/** Display — Space Grotesk (large hero/display numerals + headlines) */
export const fontSpaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/** Body — Plus Jakarta Sans */
export const fontJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Body fallback — Inter */
export const fontInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
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
export const fontVariables = [
  fontBricolage.variable,
  fontSpaceGrotesk.variable,
  fontJakarta.variable,
  fontInter.variable,
  fontDevanagari.variable,
].join(" ");
