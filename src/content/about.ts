import type { LocalizedText } from "@/lib/i18n";

/** About-page content: mission, vision, history, objectives. */

export const MISSION: LocalizedText = {
  en: "To nurture confident, responsible, and creative students by giving them real opportunities to lead, serve, and shape their school community.",
  ne: "विद्यार्थीहरूलाई नेतृत्व, सेवा र विद्यालय समुदाय निर्माणका वास्तविक अवसरहरू दिएर आत्मविश्वासी, जिम्मेवार र सिर्जनशील बनाउनु।",
};

export const VISION: LocalizedText = {
  en: "A school where every child's voice matters and every student grows into a thoughtful, civic-minded leader.",
  ne: "एउटा विद्यालय जहाँ हरेक बालबालिकाको आवाजको महत्त्व छ र हरेक विद्यार्थी विवेकशील, नागरिक-सचेत नेता बन्छ।",
};

export interface HistoryEvent {
  year: string;
  title: LocalizedText;
  description: LocalizedText;
}

export const HISTORY: HistoryEvent[] = [
  {
    year: "2018",
    title: { en: "The club is founded", ne: "क्लबको स्थापना" },
    description: {
      en: "A small group of students and teachers established the Triveni Child Club to give students a formal voice.",
      ne: "विद्यार्थी र शिक्षकहरूको सानो समूहले विद्यार्थीहरूलाई औपचारिक आवाज दिन त्रिवेणी बाल क्लब स्थापना गरे।",
    },
  },
  {
    year: "2020",
    title: { en: "First club elections", ne: "पहिलो क्लब निर्वाचन" },
    description: {
      en: "Students elected their first committee through a transparent, school-wide vote.",
      ne: "विद्यार्थीहरूले पारदर्शी, विद्यालयव्यापी मतदानमार्फत आफ्नो पहिलो समिति चुने।",
    },
  },
  {
    year: "2022",
    title: { en: "Magazine launched", ne: "पत्रिका प्रकाशन" },
    description: {
      en: "The first student magazine showcased writing, art, and reporting by club members.",
      ne: "पहिलो विद्यार्थी पत्रिकाले क्लब सदस्यहरूको लेखन, कला र रिपोर्टिङ प्रस्तुत गर्‍यो।",
    },
  },
  {
    year: "2025",
    title: { en: "Going digital", ne: "डिजिटल यात्रा" },
    description: {
      en: "The club began building this portal to bring activities, voting, and recognition online.",
      ne: "क्लबले गतिविधि, मतदान र सम्मानलाई अनलाइन ल्याउन यो पोर्टल निर्माण सुरु गर्‍यो।",
    },
  },
];

export interface Objective {
  title: LocalizedText;
  description: LocalizedText;
}

export const OBJECTIVES: Objective[] = [
  {
    title: { en: "Leadership", ne: "नेतृत्व" },
    description: {
      en: "Develop leadership and decision-making skills through real responsibility.",
      ne: "वास्तविक जिम्मेवारीमार्फत नेतृत्व र निर्णय क्षमता विकास गर्ने।",
    },
  },
  {
    title: { en: "Participation", ne: "सहभागिता" },
    description: {
      en: "Encourage every student to take part in activities and democratic processes.",
      ne: "हरेक विद्यार्थीलाई गतिविधि र लोकतान्त्रिक प्रक्रियामा सहभागी हुन प्रोत्साहन गर्ने।",
    },
  },
  {
    title: { en: "Creativity", ne: "सिर्जनशीलता" },
    description: {
      en: "Provide a platform for arts, writing, and creative expression.",
      ne: "कला, लेखन र सिर्जनात्मक अभिव्यक्तिका लागि मञ्च प्रदान गर्ने।",
    },
  },
  {
    title: { en: "Service", ne: "सेवा" },
    description: {
      en: "Build civic responsibility through community and environmental service.",
      ne: "समुदाय र वातावरणीय सेवामार्फत नागरिक जिम्मेवारी निर्माण गर्ने।",
    },
  },
];

export const CLUB_STATS = [
  { value: "200+", label: { en: "Active members", ne: "सक्रिय सदस्य" } },
  { value: "30+", label: { en: "Activities a year", ne: "वार्षिक गतिविधि" } },
  { value: "12", label: { en: "Committee roles", ne: "समिति भूमिका" } },
  { value: "2018", label: { en: "Founded", ne: "स्थापना" } },
] as const;
