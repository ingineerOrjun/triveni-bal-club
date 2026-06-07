import type { LocalizedText } from "@/lib/i18n";

/**
 * Site-wide identity, navigation, and contact information.
 * Single source of truth for the club's public-facing metadata.
 */

export const SITE = {
  name: "Triveni Child Club",
  nameNe: "त्रिवेणी बाल क्लब",
  school: "Triveni Barah Nanda Prasad Tripathee School",
  schoolNe: "त्रिवेणी बाह्र नन्द प्रसाद त्रिपाठी विद्यालय",
  tagline: {
    en: "Where students lead, grow, and shine.",
    ne: "जहाँ विद्यार्थीहरू नेतृत्व गर्छन्, बढ्छन्, र चम्किन्छन्।",
  } satisfies LocalizedText,
  description: {
    en: "The official portal of the Triveni Child Club — a student-led community for activities, elections, achievements, and student voice.",
    ne: "त्रिवेणी बाल क्लबको आधिकारिक पोर्टल — गतिविधि, निर्वाचन, उपलब्धि र विद्यार्थी आवाजका लागि विद्यार्थी नेतृत्वको समुदाय।",
  } satisfies LocalizedText,
  // Used as the canonical origin for absolute URLs / Open Graph.
  url: "https://triveni-child-club.example.np",
  locale: "en_US",
  founded: 2018,
} as const;

export interface NavItem {
  label: LocalizedText;
  href: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: { en: "Home", ne: "गृहपृष्ठ" }, href: "/" },
  { label: { en: "About", ne: "हाम्रोबारे" }, href: "/about" },
  { label: { en: "Committee", ne: "समिति" }, href: "/committee" },
  { label: { en: "Activities", ne: "गतिविधि" }, href: "/activities" },
  { label: { en: "Events", ne: "कार्यक्रम" }, href: "/events" },
  { label: { en: "Gallery", ne: "ग्यालरी" }, href: "/gallery" },
  { label: { en: "Achievements", ne: "उपलब्धि" }, href: "/achievements" },
  { label: { en: "Magazine", ne: "पत्रिका" }, href: "/magazine" },
  { label: { en: "Contact", ne: "सम्पर्क" }, href: "/contact" },
];

export const CONTACT = {
  email: "club@triveni.edu.np",
  phone: "+977 00-000000",
  address: {
    en: "Triveni Barah Nanda Prasad Tripathee School, Nepal",
    ne: "त्रिवेणी बाह्र नन्द प्रसाद त्रिपाठी विद्यालय, नेपाल",
  } satisfies LocalizedText,
  hours: {
    en: "Sunday – Friday, 10:00 AM – 4:00 PM",
    ne: "आइतबार – शुक्रबार, बिहान १०:०० – बेलुका ४:००",
  } satisfies LocalizedText,
} as const;

export const SOCIAL = {
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/",
} as const;
