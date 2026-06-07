import { z } from "zod";

export const SUGGESTION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "planned",
  "in_progress",
  "implemented",
  "rejected",
  "archived",
] as const;

/** Member-facing create/edit input. Priority & status are NOT member-settable. */
export const suggestionInputSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(140),
  description: z.string().trim().min(10, "Please describe your idea").max(4000),
  category_id: z.string().uuid().optional().or(z.literal("")),
  visibility: z.enum(["private", "members", "public"]).default("members"),
  is_anonymous: z.coerce.boolean().optional(),
  tags: z.array(z.string().uuid()).max(8).optional(),
});
export type SuggestionInput = z.infer<typeof suggestionInputSchema>;

/** Staff status change. */
export const statusChangeSchema = z.object({
  status: z.enum(SUGGESTION_STATUSES),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Staff triage fields. */
export const triageSchema = z.object({
  priority: z.enum(["low", "medium", "high", "critical"]),
  assigned_to: z.string().uuid().optional().or(z.literal("")),
  estimated_completion: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .optional()
    .or(z.literal("")),
  moderator_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const feedbackSchema = z.object({
  body: z.string().trim().min(3, "Feedback is too short").max(2000),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  name_ne: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  is_active: z.coerce.boolean().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;
