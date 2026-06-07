import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .optional()
  .or(z.literal("").transform(() => undefined));

/* --------------------------------- badges --------------------------------- */
export const badgeInputSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  criteria: z.string().trim().max(300).optional().or(z.literal("")),
  image_url: optionalUrl,
  is_active: z.coerce.boolean().optional(),
});
export type BadgeInput = z.infer<typeof badgeInputSchema>;

/* ----------------------------- achievements ------------------------------- */
export const achievementInputSchema = z.object({
  member_id: z.string().uuid("Choose a recipient"),
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  award_date: optionalDate,
  evidence: z.string().trim().max(500).optional().or(z.literal("")),
  visibility: z.enum(["public", "members", "private"]).default("members"),
});
export type AchievementInput = z.infer<typeof achievementInputSchema>;

/* ------------------------------ certificates ------------------------------ */
export const certificateInputSchema = z.object({
  recipient_id: z.string().uuid("Choose a recipient"),
  title: z.string().trim().min(3, "Title is too short").max(160),
  achievement_id: z.string().uuid().optional().or(z.literal("")),
  issued_date: optionalDate,
});
export type CertificateInput = z.infer<typeof certificateInputSchema>;

/* --------------------------- recognition programs ------------------------- */
export const programInputSchema = z
  .object({
    name: z.string().trim().min(3, "Name is too short").max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    criteria: z.string().trim().max(1000).optional().or(z.literal("")),
    starts_on: optionalDate,
    ends_on: optionalDate,
  })
  .refine(
    (v) => !v.starts_on || !v.ends_on || v.ends_on >= v.starts_on,
    { message: "End date must be on or after the start date", path: ["ends_on"] }
  );
export type ProgramInput = z.infer<typeof programInputSchema>;

/* --------------------------- recognition awards --------------------------- */
export const awardInputSchema = z.object({
  program_id: z.string().uuid(),
  member_id: z.string().uuid("Choose a recipient"),
  title: z.string().trim().min(3, "Title is too short").max(160),
  period_label: z.string().trim().max(60).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type AwardInput = z.infer<typeof awardInputSchema>;
