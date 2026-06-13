import { z } from "zod";

/** Article metadata edited alongside the block content. */
export const articleMetaSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(180),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  edition_id: z.string().uuid().optional().or(z.literal("")),
  cover_image: z.string().trim().url().optional().or(z.literal("")),
  seo_title: z.string().trim().max(180).optional().or(z.literal("")),
  seo_description: z.string().trim().max(300).optional().or(z.literal("")),
});
export type ArticleMetaInput = z.infer<typeof articleMetaSchema>;

export const editionInputSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(180),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  cover_image: z.string().trim().url().optional().or(z.literal("")),
  volume: z.coerce.number().int().min(0).max(999).optional(),
  issue_number: z.coerce.number().int().min(0).max(999).optional(),
  seo_title: z.string().trim().max(180).optional().or(z.literal("")),
  seo_description: z.string().trim().max(300).optional().or(z.literal("")),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
});

export const commentInputSchema = z.object({
  article_id: z.string().uuid(),
  content: z.string().trim().min(2, "Say a little more").max(2000, "Keep it under 2000 characters"),
});

/** One editor block as posted from the client (JSON in a hidden field). */
export const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  hidden: z.boolean().default(false),
  data: z.record(z.unknown()).default({}),
});
export const blocksPayloadSchema = z.array(blockSchema).max(300);
