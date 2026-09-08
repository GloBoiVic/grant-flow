import { z } from "zod";

export const FunderType = {
  FOUNDATION: "FOUNDATION",
  FAMILY_FUND: "FAMILY_FUND",
  CORPORATION: "CORPORATION",
  OTHER: "OTHER",
} as const satisfies Record<string, string>;

export type FunderType = (typeof FunderType)[keyof typeof FunderType];

export const funderTypeSchema = z.enum(FunderType);

const websiteField = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed === "") return null;
    return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) || !trimmed.includes(".") ? trimmed : `https://${trimmed}`;
  },
  z.string().trim().url().max(2048).refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Invalid URL").nullable(),
);

const textField = (max: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(max).nullable(),
);

const funderFields = {
  name: z.string().trim().min(1, "Name is required").max(200),
  type: funderTypeSchema,
  website: websiteField,
  countyServed: textField(200),
  notes: textField(10_000),
};

export const createFunderSchema = z.object({
  ...funderFields,
  website: funderFields.website.optional(),
  countyServed: funderFields.countyServed.optional(),
  notes: funderFields.notes.optional(),
}).strict();

export type CreateFunderInput = z.infer<typeof createFunderSchema>;

export const editFunderSchema = z.object({
  funderId: z.string().min(1),
  name: funderFields.name,
  type: funderFields.type,
  website: funderFields.website,
  countyServed: funderFields.countyServed,
  notes: funderFields.notes,
}).strict();

export type EditFunderInput = z.infer<typeof editFunderSchema>;
