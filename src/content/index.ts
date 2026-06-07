/**
 * Content layer barrel.
 *
 * All public-website content lives here as typed TypeScript objects, modelled
 * on the Phase-1 database schema. When the Supabase CMS lands, these modules
 * become data-access functions with the same return shapes — pages won't change.
 */
export * from "./types";
export * from "./site";
export * from "./about";
export * from "./activities";
export * from "./events";
export * from "./committee";
export * from "./achievements";
export * from "./gallery";
export * from "./magazine";
export * from "./student-voice";
