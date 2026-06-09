import { z } from "zod";

export const electionInputSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const positionInputSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  seats: z.coerce.number().int().min(1).max(20).default(1),
});

export const nominationInputSchema = z.object({
  election_id: z.string().uuid(),
  position_id: z.string().uuid("Choose a position"),
  slogan: z.string().trim().max(160).optional().or(z.literal("")),
  manifesto: z.string().trim().max(4000).optional().or(z.literal("")),
  vision: z.string().trim().max(2000).optional().or(z.literal("")),
  goals: z.string().trim().max(2000).optional().or(z.literal("")),
  photo_url: z.string().trim().url().optional().or(z.literal("")),
  banner_url: z.string().trim().url().optional().or(z.literal("")),
});
export type NominationInput = z.infer<typeof nominationInputSchema>;
