import { describe, expect, it } from "vitest";

import { createFunderSchema } from "@/lib/validations/funder";
import { changeGrantStatusSchema, createGrantSchema, editGrantSchema, GrantStatus } from "@/lib/validations/grant";

describe("domain server contracts", () => {
  it("rejects server-owned funder fields", () => {
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", organizationId: "org" }).success).toBe(false);
  });

  it("accepts only money with at most two fractional digits and canonical dates", () => {
    const result = createGrantSchema.safeParse({ funderId: "funder", title: "Program", status: GrantStatus.Research, amountRequested: "100.25", deadline: "2026-02-28" });
    expect(result.success).toBe(true);
    expect(createGrantSchema.safeParse({ funderId: "funder", title: "Program", status: GrantStatus.Research, amountRequested: "100.256" }).success).toBe(false);
    expect(createGrantSchema.safeParse({ funderId: "funder", title: "Program", status: GrantStatus.Research, deadline: "2026-2-28" }).success).toBe(false);
    expect(createGrantSchema.safeParse({ funderId: "funder", title: "Program", status: GrantStatus.Research, deadline: "2026-02-30" }).success).toBe(false);
  });

  it("keeps edit and status contracts separate", () => {
    expect(editGrantSchema.safeParse({ grantId: "grant", status: GrantStatus.Awarded }).success).toBe(false);
    expect(changeGrantStatusSchema.safeParse({ grantId: "grant", status: GrantStatus.Awarded }).success).toBe(true);
    expect(changeGrantStatusSchema.safeParse({ grantId: "grant", status: "Unknown" }).success).toBe(false);
  });
});
