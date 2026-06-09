/**
 * Block registry (plugin architecture) — client-safe metadata.
 *
 * To add a section type: add a `BlockTypeMeta` here and a `case` in the
 * PageRenderer (`src/components/cms/page-renderer.tsx`). The builder editor is
 * generated automatically from `fields`. No builder rewrite required.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "image"
  | "boolean"
  | "select"
  | "list";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  /** For type "list": the sub-fields of each item. */
  itemFields?: FieldDef[];
}

export interface BlockTypeMeta {
  type: string;
  label: string;
  group: "content" | "media" | "layout" | "dynamic";
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  adminOnly?: boolean;
}

export interface Block {
  id: string;
  type: string;
  enabled: boolean;
  props: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  {
    type: "hero",
    label: "Hero",
    group: "content",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "ctaLabel", label: "Button label", type: "text" },
      { key: "ctaHref", label: "Button link", type: "text", placeholder: "/about" },
      { key: "image", label: "Image", type: "image" },
    ],
    defaults: { title: "Welcome", subtitle: "", ctaLabel: "", ctaHref: "/", image: "" },
  },
  {
    type: "heading",
    label: "Heading",
    group: "content",
    fields: [
      { key: "text", label: "Text", type: "text" },
      { key: "eyebrow", label: "Eyebrow (small label)", type: "text" },
    ],
    defaults: { text: "Section title", eyebrow: "" },
  },
  {
    type: "richtext",
    label: "Rich text",
    group: "content",
    fields: [{ key: "content", label: "Content", type: "richtext" }],
    defaults: { content: "" },
  },
  {
    type: "image",
    label: "Image",
    group: "media",
    fields: [
      { key: "url", label: "Image", type: "image" },
      { key: "alt", label: "Alt text", type: "text" },
      { key: "caption", label: "Caption", type: "text" },
    ],
    defaults: { url: "", alt: "", caption: "" },
  },
  {
    type: "statistics",
    label: "Statistics",
    group: "content",
    fields: [
      {
        key: "items",
        label: "Stats",
        type: "list",
        itemFields: [
          { key: "value", label: "Value", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
    defaults: { items: [{ value: "200+", label: "Members" }] },
  },
  {
    type: "cardGrid",
    label: "Card grid",
    group: "content",
    fields: [
      {
        key: "items",
        label: "Cards",
        type: "list",
        itemFields: [
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "href", label: "Link (optional)", type: "text" },
        ],
      },
    ],
    defaults: { items: [{ title: "Card", body: "", href: "" }] },
  },
  {
    type: "cta",
    label: "Call to action",
    group: "content",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "primaryLabel", label: "Primary button", type: "text" },
      { key: "primaryHref", label: "Primary link", type: "text" },
      { key: "secondaryLabel", label: "Secondary button", type: "text" },
      { key: "secondaryHref", label: "Secondary link", type: "text" },
    ],
    defaults: { title: "Ready to join?", description: "", primaryLabel: "Get started", primaryHref: "/contact", secondaryLabel: "", secondaryHref: "" },
  },
  {
    type: "quote",
    label: "Quote",
    group: "content",
    fields: [
      { key: "text", label: "Quote", type: "textarea" },
      { key: "author", label: "Author", type: "text" },
    ],
    defaults: { text: "", author: "" },
  },
  {
    type: "divider",
    label: "Divider",
    group: "layout",
    fields: [],
    defaults: {},
  },
  {
    type: "spacer",
    label: "Spacer",
    group: "layout",
    fields: [
      {
        key: "size",
        label: "Size",
        type: "select",
        options: [
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
        ],
      },
    ],
    defaults: { size: "md" },
  },
  {
    type: "widgetEvents",
    label: "Widget: Upcoming events",
    group: "dynamic",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "limit", label: "How many", type: "number" },
    ],
    defaults: { heading: "Upcoming events", limit: 3 },
  },
  {
    type: "widgetCommittee",
    label: "Widget: Committee",
    group: "dynamic",
    fields: [{ key: "heading", label: "Heading", type: "text" }],
    defaults: { heading: "Our committee" },
  },
  {
    type: "customHtml",
    label: "Custom HTML (admin)",
    group: "layout",
    adminOnly: true,
    fields: [{ key: "html", label: "HTML", type: "textarea", help: "Sanitised on render." }],
    defaults: { html: "" },
  },
];

export function getBlockType(type: string): BlockTypeMeta | undefined {
  return BLOCK_TYPES.find((b) => b.type === type);
}

export function blockDefaults(type: string): Record<string, unknown> {
  return structuredClone(getBlockType(type)?.defaults ?? {});
}
