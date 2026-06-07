import { z } from "zod";

const dateTimeLocal = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Use a valid date & time");

const optionalDateTime = dateTimeLocal
  .optional()
  .or(z.literal("").transform(() => undefined));

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(120),
    title_ne: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    venue: z.string().trim().max(160).optional().or(z.literal("")),
    starts_at: dateTimeLocal,
    ends_at: optionalDateTime,
    capacity: z
      .union([
        z.literal("").transform(() => undefined),
        z.coerce.number().int().positive("Capacity must be positive"),
      ])
      .optional(),
    registration_deadline: optionalDateTime,
  })
  .refine(
    (v) => !v.ends_at || v.ends_at >= v.starts_at,
    { message: "End must be after the start", path: ["ends_at"] }
  )
  .refine(
    (v) => !v.registration_deadline || v.registration_deadline <= v.starts_at,
    {
      message: "Deadline should be on or before the event start",
      path: ["registration_deadline"],
    }
  );

export type EventInput = z.infer<typeof eventInputSchema>;
