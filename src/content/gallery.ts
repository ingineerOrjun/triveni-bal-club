import type { GalleryItem, GalleryCategory } from "./types";
import type { LocalizedText } from "@/lib/i18n";

export const GALLERY_CATEGORIES: {
  value: GalleryCategory | "all";
  label: LocalizedText;
}[] = [
  { value: "all", label: { en: "All", ne: "सबै" } },
  { value: "events", label: { en: "Events", ne: "कार्यक्रम" } },
  { value: "activities", label: { en: "Activities", ne: "गतिविधि" } },
  { value: "community", label: { en: "Community", ne: "समुदाय" } },
  { value: "sports", label: { en: "Sports", ne: "खेलकुद" } },
  { value: "arts", label: { en: "Arts", ne: "कला" } },
];

// Round-robin metadata so the 30 real photos get meaningful categories/captions.
const ROTATION: {
  category: GalleryCategory;
  caption: LocalizedText;
}[] = [
  { category: "events", caption: { en: "Club gathering", ne: "क्लब भेला" } },
  { category: "activities", caption: { en: "Activity in action", ne: "गतिविधि" } },
  { category: "community", caption: { en: "Community moment", ne: "सामुदायिक क्षण" } },
  { category: "sports", caption: { en: "On the field", ne: "मैदानमा" } },
  { category: "arts", caption: { en: "Creative work", ne: "सिर्जनात्मक काम" } },
];

export const GALLERY: GalleryItem[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const meta = ROTATION[i % ROTATION.length];
  const id = String(n).padStart(2, "0");
  return {
    id: `g-${id}`,
    image: {
      src: `/gallery/triveni-${id}.jpeg`,
      alt: `Triveni Child Club — ${meta.caption.en.toLowerCase()} (photo ${n})`,
    },
    caption: meta.caption,
    category: meta.category,
    year: 2025,
  } satisfies GalleryItem;
});

export function getGalleryByCategory(
  category: GalleryCategory | "all"
): GalleryItem[] {
  if (category === "all") return GALLERY;
  return GALLERY.filter((g) => g.category === category);
}
