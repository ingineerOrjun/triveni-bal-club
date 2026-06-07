import type { CommitteeMember } from "./types";

/**
 * Committee for the current term. `kind` groups members into Leadership,
 * Members, and Advisor sections on the committee page.
 */
export const COMMITTEE_TERM = "2025–2026";

export const COMMITTEE: CommitteeMember[] = [
  // Leadership
  {
    id: "pres",
    name: { en: "Aarav Sharma", ne: "आरव शर्मा" },
    position: { en: "President", ne: "अध्यक्ष" },
    kind: "leadership",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 10",
    bio: {
      en: "Leads the club's vision and chairs committee meetings.",
      ne: "क्लबको दृष्टिकोण नेतृत्व गर्छन् र समिति बैठकको अध्यक्षता गर्छन्।",
    },
  },
  {
    id: "vp",
    name: { en: "Priya Karki", ne: "प्रिया कार्की" },
    position: { en: "Vice President", ne: "उपाध्यक्ष" },
    kind: "leadership",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 10",
    bio: {
      en: "Supports the president and coordinates activity leads.",
      ne: "अध्यक्षलाई सहयोग गर्छन् र गतिविधि नेतृत्वकर्ताहरूको समन्वय गर्छन्।",
    },
  },
  {
    id: "sec",
    name: { en: "Sita Chaudhary", ne: "सीता चौधरी" },
    position: { en: "Secretary", ne: "सचिव" },
    kind: "leadership",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 9",
    bio: {
      en: "Keeps records, minutes, and club communications.",
      ne: "अभिलेख, बैठक विवरण र क्लब सञ्चार राख्छन्।",
    },
  },
  {
    id: "treas",
    name: { en: "Bibek Thapa", ne: "विवेक थापा" },
    position: { en: "Treasurer", ne: "कोषाध्यक्ष" },
    kind: "leadership",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 9",
    bio: {
      en: "Manages the club budget and event funds.",
      ne: "क्लब बजेट र कार्यक्रम कोष व्यवस्थापन गर्छन्।",
    },
  },
  // Members (coordinators)
  {
    id: "m-env",
    name: { en: "Anjali Gurung", ne: "अञ्जली गुरुङ" },
    position: { en: "Environment Coordinator", ne: "वातावरण संयोजक" },
    kind: "member",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 8",
  },
  {
    id: "m-arts",
    name: { en: "Rohan Magar", ne: "रोहन मगर" },
    position: { en: "Arts Coordinator", ne: "कला संयोजक" },
    kind: "member",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 8",
  },
  {
    id: "m-sports",
    name: { en: "Nisha Rai", ne: "निशा राई" },
    position: { en: "Sports Coordinator", ne: "खेलकुद संयोजक" },
    kind: "member",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 9",
  },
  {
    id: "m-lit",
    name: { en: "Kiran Lama", ne: "किरण लामा" },
    position: { en: "Literary Coordinator", ne: "साहित्य संयोजक" },
    kind: "member",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 8",
  },
  {
    id: "m-media",
    name: { en: "Sneha Bhattarai", ne: "स्नेहा भट्टराई" },
    position: { en: "Media Coordinator", ne: "सञ्चार संयोजक" },
    kind: "member",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 9",
  },
  {
    id: "m-service",
    name: { en: "Prakash Oli", ne: "प्रकाश ओली" },
    position: { en: "Service Coordinator", ne: "सेवा संयोजक" },
    kind: "member",
    termLabel: COMMITTEE_TERM,
    classLevel: "Grade 8",
  },
  // Advisor
  {
    id: "advisor",
    name: { en: "Mr. Ramesh Tripathee", ne: "श्री रमेश त्रिपाठी" },
    position: { en: "Teacher Advisor", ne: "शिक्षक सल्लाहकार" },
    kind: "advisor",
    termLabel: COMMITTEE_TERM,
    bio: {
      en: "Guides the club, mentors student leaders, and oversees activities.",
      ne: "क्लबलाई मार्गदर्शन गर्छन्, विद्यार्थी नेतालाई सल्लाह दिन्छन्।",
    },
  },
];

export function getCommitteeByKind(kind: CommitteeMember["kind"]) {
  return COMMITTEE.filter((m) => m.kind === kind);
}
