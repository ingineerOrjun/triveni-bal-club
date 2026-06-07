import type { StudentVoice } from "./types";

/** Short student testimonials shown on the homepage "Student Voice" section. */
export const STUDENT_VOICE: StudentVoice[] = [
  {
    id: "sv-1",
    quote: {
      en: "The club gave me the courage to speak up. Now I lead my own activity.",
      ne: "क्लबले मलाई बोल्ने आँट दियो। अहिले म आफ्नै गतिविधि नेतृत्व गर्छु।",
    },
    name: { en: "Priya Karki", ne: "प्रिया कार्की" },
    classLevel: "Grade 10",
  },
  {
    id: "sv-2",
    quote: {
      en: "Voting in our elections made me feel my opinion truly counts.",
      ne: "हाम्रो निर्वाचनमा मतदान गर्दा मेरो विचारको साँच्चै महत्त्व छ भन्ने लाग्यो।",
    },
    name: { en: "Bibek Thapa", ne: "विवेक थापा" },
    classLevel: "Grade 9",
  },
  {
    id: "sv-3",
    quote: {
      en: "I planted my first tree with the club. It's taller than me now!",
      ne: "मैले क्लबसँग पहिलो रूख रोपेँ। अब त त्यो मभन्दा अग्लो भयो!",
    },
    name: { en: "Anjali Gurung", ne: "अञ्जली गुरुङ" },
    classLevel: "Grade 8",
  },
];
