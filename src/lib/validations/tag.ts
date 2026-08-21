import { z } from "zod";

const TAG_NAME_MAX_LENGTH = 50;

const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag name is required")
  .superRefine((value, context) => {
    if (Array.from(value).length > TAG_NAME_MAX_LENGTH) {
      context.addIssue({
        code: "too_big",
        maximum: TAG_NAME_MAX_LENGTH,
        origin: "string",
        inclusive: true,
        message: `Tag name must be ${TAG_NAME_MAX_LENGTH} characters or fewer.`,
      });
    }
  });

export const createTagSchema = z.object({
  name: tagNameSchema,
}).strict();

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const assignTagSchema = z.object({
  grantId: z.string().min(1),
  tagId: z.string().min(1),
}).strict();

export type AssignTagInput = z.infer<typeof assignTagSchema>;

export const removeTagSchema = z.object({
  grantId: z.string().min(1),
  tagId: z.string().min(1),
}).strict();

export type RemoveTagInput = z.infer<typeof removeTagSchema>;

/** Derives the database uniqueness key; callers must never provide it. */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}
