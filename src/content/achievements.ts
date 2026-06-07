import type { Achievement } from "./types";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach-debate-district",
    title: { en: "District Debate Champions", ne: "जिल्ला वादविवाद विजेता" },
    description: {
      en: "Our debate team won first place at the district inter-school championship.",
      ne: "हाम्रो वादविवाद टोलीले जिल्ला अन्तर-विद्यालय प्रतियोगितामा प्रथम स्थान हासिल गर्‍यो।",
    },
    type: "competition",
    awardedOn: "2025-11-18",
    recipient: { en: "Debate & Public Speaking Team", ne: "वादविवाद टोली" },
    image: { src: "/gallery/triveni-18.jpeg", alt: "Debate team with their trophy" },
  },
  {
    id: "ach-green-school",
    title: { en: "Green School Recognition", ne: "हरित विद्यालय सम्मान" },
    description: {
      en: "Recognized by the municipality for outstanding environmental initiatives.",
      ne: "उत्कृष्ट वातावरणीय पहलका लागि नगरपालिकाद्वारा सम्मानित।",
    },
    type: "club",
    awardedOn: "2025-09-30",
    recipient: { en: "Environment Team", ne: "वातावरण टोली" },
    image: { src: "/gallery/triveni-03.jpeg", alt: "Green school recognition" },
  },
  {
    id: "ach-art-gold",
    title: { en: "Gold in Regional Art Contest", ne: "क्षेत्रीय कला प्रतियोगितामा स्वर्ण" },
    description: {
      en: "A club member earned the gold medal in the regional painting competition.",
      ne: "क्लब सदस्यले क्षेत्रीय चित्रकला प्रतियोगितामा स्वर्ण पदक जिते।",
    },
    type: "arts",
    awardedOn: "2025-12-10",
    recipient: { en: "Rohan Magar (Grade 8)", ne: "रोहन मगर (कक्षा ८)" },
    image: { src: "/gallery/triveni-09.jpeg", alt: "Award-winning artwork" },
  },
  {
    id: "ach-sports-relay",
    title: { en: "Relay Race Winners", ne: "रिले दौड विजेता" },
    description: {
      en: "First place in the inter-house 4×100m relay at the annual sports meet.",
      ne: "वार्षिक खेलकुदमा अन्तर-हाउस ४×१०० मिटर रिलेमा प्रथम।",
    },
    type: "sports",
    awardedOn: "2026-02-21",
    recipient: { en: "House Blue", ne: "नीलो हाउस" },
    image: { src: "/gallery/triveni-12.jpeg", alt: "Relay race winners" },
  },
  {
    id: "ach-science-merit",
    title: { en: "Science Fair Merit Award", ne: "विज्ञान मेला उत्कृष्टता पुरस्कार" },
    description: {
      en: "A water-filtration model earned a merit award at the city science fair.",
      ne: "पानी छान्ने मोडेलले सहर विज्ञान मेलामा उत्कृष्टता पुरस्कार पायो।",
    },
    type: "academic",
    awardedOn: "2025-10-05",
    recipient: { en: "Innovation Team", ne: "नवप्रवर्तन टोली" },
    image: { src: "/gallery/triveni-25.jpeg", alt: "Science fair project" },
  },
  {
    id: "ach-200-members",
    title: { en: "200 Members Milestone", ne: "२०० सदस्य उपलब्धि" },
    description: {
      en: "The club crossed 200 active members — its largest community yet.",
      ne: "क्लबले २०० सक्रिय सदस्य नाघ्यो — अहिलेसम्मकै ठूलो समुदाय।",
    },
    type: "milestone",
    awardedOn: "2025-08-01",
    image: { src: "/gallery/triveni-05.jpeg", alt: "Club members together" },
  },
];

export function getAchievementsSorted(): Achievement[] {
  return [...ACHIEVEMENTS].sort(
    (a, b) => new Date(b.awardedOn).getTime() - new Date(a.awardedOn).getTime()
  );
}
