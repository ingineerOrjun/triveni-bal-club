import type { Activity, ActivityCategory } from "./types";
import type { LocalizedText } from "@/lib/i18n";

export const ACTIVITY_CATEGORIES: {
  value: ActivityCategory;
  label: LocalizedText;
}[] = [
  { value: "leadership", label: { en: "Leadership", ne: "नेतृत्व" } },
  { value: "environment", label: { en: "Environment", ne: "वातावरण" } },
  { value: "arts", label: { en: "Arts & Culture", ne: "कला र संस्कृति" } },
  { value: "sports", label: { en: "Sports", ne: "खेलकुद" } },
  { value: "literary", label: { en: "Literary", ne: "साहित्यिक" } },
  { value: "service", label: { en: "Community Service", ne: "सामुदायिक सेवा" } },
  { value: "science", label: { en: "Science & Tech", ne: "विज्ञान र प्रविधि" } },
];

export const ACTIVITIES: Activity[] = [
  {
    slug: "tree-plantation-drive",
    title: { en: "Tree Plantation Drive", ne: "वृक्षरोपण अभियान" },
    summary: {
      en: "Students plant and care for trees across the school campus.",
      ne: "विद्यार्थीहरूले विद्यालय परिसरमा रूख रोप्ने र हेरचाह गर्ने।",
    },
    body: {
      en: "Each year club members lead a campus-wide plantation drive, planting native species and committing to care for them through the seasons. The drive builds environmental awareness and a sense of shared ownership of our spaces.",
      ne: "हरेक वर्ष क्लब सदस्यहरूले परिसरव्यापी वृक्षरोपण अभियान नेतृत्व गर्छन्।",
    },
    category: "environment",
    term: "2025–2026",
    image: { src: "/gallery/triveni-03.jpeg", alt: "Students planting trees on campus" },
    featured: true,
    participants: 48,
    startsOn: "2025-07-12",
  },
  {
    slug: "annual-art-exhibition",
    title: { en: "Annual Art Exhibition", ne: "वार्षिक कला प्रदर्शनी" },
    summary: {
      en: "A showcase of student paintings, crafts, and installations.",
      ne: "विद्यार्थीका चित्र, हस्तकला र स्थापनाहरूको प्रदर्शनी।",
    },
    body: {
      en: "The art exhibition transforms the school hall into a gallery of student creativity — from canvas paintings to recycled-material sculptures. Families and the wider community are invited to celebrate the work.",
      ne: "कला प्रदर्शनीले विद्यालय हललाई विद्यार्थी सिर्जनशीलताको ग्यालरीमा परिणत गर्छ।",
    },
    category: "arts",
    term: "2025–2026",
    image: { src: "/gallery/triveni-07.jpeg", alt: "Student artwork on display" },
    featured: true,
    participants: 60,
    startsOn: "2025-12-05",
  },
  {
    slug: "inter-house-sports-meet",
    title: { en: "Inter-House Sports Meet", ne: "अन्तर-हाउस खेलकुद" },
    summary: {
      en: "Friendly athletics competition between school houses.",
      ne: "विद्यालय हाउसहरूबीच मैत्रीपूर्ण एथलेटिक्स प्रतियोगिता।",
    },
    body: {
      en: "Track and field, team games, and house cheers come together for our most energetic event of the year. The meet emphasizes teamwork, fair play, and school spirit.",
      ne: "वर्षको सबैभन्दा ऊर्जावान् कार्यक्रम — ट्र्याक, टिम खेल र हाउस उत्साह।",
    },
    category: "sports",
    term: "2025–2026",
    image: { src: "/gallery/triveni-12.jpeg", alt: "Students competing at the sports meet" },
    featured: true,
    participants: 120,
    startsOn: "2026-02-20",
  },
  {
    slug: "debate-and-public-speaking",
    title: { en: "Debate & Public Speaking", ne: "वादविवाद तथा वक्तृत्व" },
    summary: {
      en: "Weekly club to build confidence and critical thinking.",
      ne: "आत्मविश्वास र आलोचनात्मक सोच निर्माण गर्ने साप्ताहिक क्लब।",
    },
    body: {
      en: "Members practice structured debate, impromptu speaking, and respectful argument. The club regularly hosts in-school competitions and prepares teams for district-level events.",
      ne: "सदस्यहरूले संरचित वादविवाद र वक्तृत्व अभ्यास गर्छन्।",
    },
    category: "literary",
    term: "2025–2026",
    image: { src: "/gallery/triveni-18.jpeg", alt: "Student speaking at a debate" },
    participants: 32,
  },
  {
    slug: "community-clean-up",
    title: { en: "Community Clean-Up", ne: "सामुदायिक सरसफाइ" },
    summary: {
      en: "Students keep the neighbourhood clean and green.",
      ne: "विद्यार्थीहरूले छिमेकलाई सफा र हरियो राख्ने।",
    },
    body: {
      en: "Club volunteers organize regular clean-up walks around the school and nearby community, sorting waste for recycling and raising awareness about cleanliness.",
      ne: "क्लब स्वयंसेवकहरूले विद्यालय वरपर नियमित सरसफाइ आयोजना गर्छन्।",
    },
    category: "service",
    term: "2025–2026",
    image: { src: "/gallery/triveni-21.jpeg", alt: "Students during a community clean-up" },
    participants: 40,
  },
  {
    slug: "science-innovation-fair",
    title: { en: "Science & Innovation Fair", ne: "विज्ञान तथा नवप्रवर्तन मेला" },
    summary: {
      en: "Hands-on projects and experiments by young innovators.",
      ne: "युवा अन्वेषकहरूका व्यावहारिक परियोजना र प्रयोग।",
    },
    body: {
      en: "From simple machines to working models, students present projects they've designed and built. Judges and visitors explore each stall and vote for crowd favourites.",
      ne: "विद्यार्थीहरूले आफूले डिजाइन गरेका परियोजना प्रस्तुत गर्छन्।",
    },
    category: "science",
    term: "2025–2026",
    image: { src: "/gallery/triveni-25.jpeg", alt: "Student science project on display" },
    participants: 54,
  },
  {
    slug: "leadership-bootcamp",
    title: { en: "Leadership Bootcamp", ne: "नेतृत्व प्रशिक्षण" },
    summary: {
      en: "Training for committee members and future leaders.",
      ne: "समिति सदस्य र भावी नेताहरूका लागि तालिम।",
    },
    body: {
      en: "A short, intensive program on communication, planning, and teamwork that prepares students to take on responsibility within the club and beyond.",
      ne: "सञ्चार, योजना र टोली कार्यमा केन्द्रित छोटो तालिम।",
    },
    category: "leadership",
    term: "2025–2026",
    image: { src: "/gallery/triveni-29.jpeg", alt: "Students at a leadership session" },
    participants: 24,
  },
];

export function getActivityBySlug(slug: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.slug === slug);
}

export function getFeaturedActivities(limit = 3): Activity[] {
  return ACTIVITIES.filter((a) => a.featured).slice(0, limit);
}
