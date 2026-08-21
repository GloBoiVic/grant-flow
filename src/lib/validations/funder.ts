import { z } from "zod";

export const FunderType = {
  FOUNDATION: "FOUNDATION",
  FAMILY_FUND: "FAMILY_FUND",
  CORPORATION: "CORPORATION",
  OTHER: "OTHER",
} as const satisfies Record<string, string>;

export type FunderType = (typeof FunderType)[keyof typeof FunderType];

export const funderTypeSchema = z.enum(FunderType);

const optionalWebsite = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().trim().url().max(2048).optional(),
);

export const createFunderSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: funderTypeSchema,
  website: optionalWebsite,
}).strict();

export type CreateFunderInput = z.infer<typeof createFunderSchema>;
