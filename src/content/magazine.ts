import type { MagazineIssue, MagazineArticle } from "./types";

export const MAGAZINE: MagazineIssue[] = [
  {
    slug: "triveni-voices-vol-2",
    title: { en: "Triveni Voices", ne: "त्रिवेणी आवाज" },
    edition: "Vol. 2 · 2025",
    description: {
      en: "Our latest issue features student stories, poems, and reports from a year of activities.",
      ne: "हाम्रो पछिल्लो अंकमा विद्यार्थी कथा, कविता र वर्षभरका गतिविधि रिपोर्ट छन्।",
    },
    cover: { src: "/gallery/triveni-09.jpeg", alt: "Triveni Voices Vol. 2 cover" },
    publishedOn: "2025-12-20",
    articles: [
      {
        slug: "my-first-debate",
        title: { en: "My First Debate", ne: "मेरो पहिलो वादविवाद" },
        excerpt: {
          en: "How stepping onto the stage changed the way I see myself.",
          ne: "मञ्चमा उक्लिँदा मैले आफूलाई हेर्ने तरिका कसरी बदलियो।",
        },
        author: "Priya Karki",
        authorClass: "Grade 10",
        category: "essay",
        featured: true,
      },
      {
        slug: "the-old-banyan-tree",
        title: { en: "The Old Banyan Tree", ne: "पुरानो बरको रूख" },
        excerpt: {
          en: "A poem about the tree that has watched over our school for generations.",
          ne: "पुस्तौंदेखि हाम्रो विद्यालय हेरिरहेको रूखबारे कविता।",
        },
        author: "Kiran Lama",
        authorClass: "Grade 8",
        category: "poem",
        featured: true,
      },
      {
        slug: "plantation-drive-report",
        title: { en: "Plantation Drive: A Report", ne: "वृक्षरोपण: एक रिपोर्ट" },
        excerpt: {
          en: "How 48 students planted hope, one sapling at a time.",
          ne: "४८ विद्यार्थीले एक-एक बिरुवा रोपेर आशा कसरी रोपे।",
        },
        author: "Anjali Gurung",
        authorClass: "Grade 8",
        category: "report",
      },
    ],
  },
  {
    slug: "triveni-voices-vol-1",
    title: { en: "Triveni Voices", ne: "त्रिवेणी आवाज" },
    edition: "Vol. 1 · 2024",
    description: {
      en: "The inaugural issue — where it all began. Student creativity in print for the first time.",
      ne: "उद्घाटन अंक — जहाँबाट सबै सुरु भयो।",
    },
    cover: { src: "/gallery/triveni-22.jpeg", alt: "Triveni Voices Vol. 1 cover" },
    publishedOn: "2024-12-18",
    articles: [
      {
        slug: "why-we-started-a-club",
        title: { en: "Why We Started a Club", ne: "हामीले किन क्लब सुरु गर्‍यौं" },
        excerpt: {
          en: "The story behind the Triveni Child Club, told by its founders.",
          ne: "त्रिवेणी बाल क्लबको कथा, संस्थापकहरूकै शब्दमा।",
        },
        author: "Aarav Sharma",
        authorClass: "Grade 10",
        category: "story",
        featured: true,
      },
      {
        slug: "colours-of-our-school",
        title: { en: "Colours of Our School", ne: "हाम्रो विद्यालयका रङहरू" },
        excerpt: {
          en: "A visual essay celebrating everyday life on campus.",
          ne: "परिसरको दैनिक जीवनको दृश्य निबन्ध।",
        },
        author: "Rohan Magar",
        authorClass: "Grade 8",
        category: "art",
      },
    ],
  },
];

export function getIssueBySlug(slug: string): MagazineIssue | undefined {
  return MAGAZINE.find((m) => m.slug === slug);
}

export function getLatestIssue(): MagazineIssue {
  return [...MAGAZINE].sort(
    (a, b) =>
      new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime()
  )[0];
}

export function getFeaturedArticles(limit = 3): MagazineArticle[] {
  return MAGAZINE.flatMap((i) => i.articles)
    .filter((a) => a.featured)
    .slice(0, limit);
}
