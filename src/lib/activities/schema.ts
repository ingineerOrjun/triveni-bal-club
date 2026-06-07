import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const activityInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(120),
    title_ne: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    category_id: z.string().uuid().optional().or(z.literal("")),
    cover_url: z
      .string()
      .trim()
      .url("Enter a valid URL")
      .optional()
      .or(z.literal("")),
    starts_on: optionalDate,
    ends_on: optionalDate,
  })
  .refine(
    (v) => !v.starts_on || !v.ends_on || v.ends_on >= v.starts_on,
    { message: "End date must be on or after the start date", path: ["ends_on"] }
  );

export type ActivityInput = z.infer<typeof activityInputSchema>;
