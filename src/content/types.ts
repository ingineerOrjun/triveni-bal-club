/**
 * Typed content model for the public website.
 *
 * Every entity mirrors the Phase-1 database schema (docs/04-database.md) so that
 * migrating this static content layer to Supabase later is a 1:1 mapping. Text
 * that may be translated uses `LocalizedText` ({ en, ne? }).
 */
import type { LocalizedText } from "@/lib/i18n";

export type { LocalizedText };

/** A locally-stored image reference (lives in /public). */
export interface ImageRef {
  /** Path under /public, e.g. "/gallery/triveni-01.jpeg" */
  src: string;
  /** Required for accessibility. */
  alt: string;
  width?: number;
  height?: number;
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                  */
/* -------------------------------------------------------------------------- */
export type ActivityCategory =
  | "leadership"
  | "environment"
  | "arts"
  | "sports"
  | "literary"
  | "service"
  | "science";

export interface Activity {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedText;
  category: ActivityCategory;
  term: string; // e.g. "2025–2026"
  image: ImageRef;
  featured?: boolean;
  participants?: number;
  startsOn?: string; // ISO date
}

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */
export interface ClubEvent {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  location: LocalizedText;
  startsAt: string; // ISO datetime
  endsAt?: string;
  image: ImageRef;
  registrationRequired?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Committee                                                                   */
/* -------------------------------------------------------------------------- */
export type CommitteeKind = "leadership" | "member" | "advisor";

export interface CommitteeMember {
  id: string;
  name: LocalizedText;
  position: LocalizedText;
  kind: CommitteeKind;
  termLabel: string;
  image?: ImageRef;
  bio?: LocalizedText;
  classLevel?: string;
}

/* -------------------------------------------------------------------------- */
/* Achievements                                                                */
/* -------------------------------------------------------------------------- */
export type AchievementType =
  | "competition"
  | "academic"
  | "sports"
  | "arts"
  | "club"
  | "milestone";

export interface Achievement {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  type: AchievementType;
  awardedOn: string; // ISO date
  recipient?: LocalizedText;
  image?: ImageRef;
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                     */
/* -------------------------------------------------------------------------- */
export type GalleryCategory =
  | "events"
  | "activities"
  | "community"
  | "sports"
  | "arts";

export interface GalleryItem {
  id: string;
  image: ImageRef;
  caption: LocalizedText;
  category: GalleryCategory;
  year: number;
}

/* -------------------------------------------------------------------------- */
/* Magazine                                                                    */
/* -------------------------------------------------------------------------- */
export interface MagazineArticle {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  author: string;
  authorClass?: string;
  category: "story" | "poem" | "essay" | "art" | "report";
  featured?: boolean;
}

export interface MagazineIssue {
  slug: string;
  title: LocalizedText;
  edition: string; // "Vol. 1 · 2025"
  description: LocalizedText;
  cover: ImageRef;
  publishedOn: string; // ISO date
  articles: MagazineArticle[];
}

/* -------------------------------------------------------------------------- */
/* Student Voice                                                               */
/* -------------------------------------------------------------------------- */
export interface StudentVoice {
  id: string;
  quote: LocalizedText;
  name: LocalizedText;
  classLevel: string;
}
