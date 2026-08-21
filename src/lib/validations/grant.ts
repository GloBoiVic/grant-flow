import { z } from "zod";

export const GrantStatus = {
  Research: "Research",
  Qualified: "Qualified",
  Planning: "Planning",
  Writing: "Writing",
  InternalReview: "Internal Review",
  Submitted: "Submitted",
  Pending: "Pending",
  Awarded: "Awarded",
  Declined: "Declined",
  Reporting: "Reporting",
  Closed: "Closed",
} as const satisfies Record<string, string>;

export type GrantStatus = (typeof GrantStatus)[keyof typeof GrantStatus];

export const grantStatusSchema = z.enum(GrantStatus);

const optionalMoney = z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount.").optional().nullable();
const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").superRefine((value, context) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    context.addIssue({ code: "custom", message: "Enter a valid calendar date." });
  }
}).optional().nullable();
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

const grantFields = {
  funderId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(200),
  status: grantStatusSchema,
  amountRequested: optionalMoney,
  amountAwarded: optionalMoney,
  deadline: optionalDate,
  decisionDate: optionalDate,
  awardTimeframe: optionalText(200),
  designation: optionalText(200),
  countyServed: optionalText(200),
  nextSteps: optionalText(2000),
  notes: optionalText(10000),
};

export const createGrantSchema = z.object(grantFields).strict();
export type CreateGrantInput = z.infer<typeof createGrantSchema>;

export const editGrantSchema = z.object({
  grantId: z.string().min(1),
  funderId: grantFields.funderId.optional(),
  title: grantFields.title.optional(),
  amountRequested: grantFields.amountRequested,
  amountAwarded: grantFields.amountAwarded,
  deadline: grantFields.deadline,
  decisionDate: grantFields.decisionDate,
  awardTimeframe: grantFields.awardTimeframe,
  designation: grantFields.designation,
  countyServed: grantFields.countyServed,
  nextSteps: grantFields.nextSteps,
  notes: grantFields.notes,
}).strict().refine((value) => Object.keys(value).some((key) => key !== "grantId" && value[key as keyof typeof value] !== undefined), {
  message: "At least one grant field is required.",
});
export type EditGrantInput = z.infer<typeof editGrantSchema>;

export const changeGrantStatusSchema = z.object({
  grantId: z.string().min(1),
  status: grantStatusSchema,
}).strict();
export type ChangeGrantStatusInput = z.infer<typeof changeGrantStatusSchema>;
