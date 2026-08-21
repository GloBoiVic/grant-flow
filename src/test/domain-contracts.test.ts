import { describe, expect, it } from "vitest";

import { createFunderSchema } from "@/lib/validations/funder";
import { changeGrantStatusSchema, createGrantSchema, editGrantSchema, GrantStatus } from "@/lib/validations/grant";
import { assignTagSchema, createTagSchema, normalizeTagName, removeTagSchema } from "@/lib/validations/tag";

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

  it("trims tag names and limits Unicode characters", () => {
    const result = createTagSchema.safeParse({ name: "  Housing 🏠  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ name: "Housing 🏠" });
    expect(createTagSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createTagSchema.safeParse({ name: "😀".repeat(50) }).success).toBe(true);
    expect(createTagSchema.safeParse({ name: "😀".repeat(51) }).success).toBe(false);
    expect(normalizeTagName("  Housing  ")).toBe(normalizeTagName("housing"));
  });

  it("rejects server-owned and arbitrary tag fields", () => {
    const clientOwnedFields = {
      organizationId: "other-org",
      normalizedName: "housing",
      color: "#000000",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      activity: { action: "tag_created" },
      metadata: { arbitrary: true },
    };

    expect(createTagSchema.safeParse({ name: "Housing", ...clientOwnedFields }).success).toBe(false);
    expect(assignTagSchema.safeParse({ grantId: "grant", tagId: "tag", ...clientOwnedFields }).success).toBe(false);
    expect(removeTagSchema.safeParse({ grantId: "grant", tagId: "tag", ...clientOwnedFields }).success).toBe(false);
  });

  it("accepts only the identifiers needed for idempotent assignment changes", () => {
    expect(assignTagSchema.safeParse({ grantId: "grant", tagId: "tag" }).success).toBe(true);
    expect(removeTagSchema.safeParse({ grantId: "grant", tagId: "tag" }).success).toBe(true);
    expect(assignTagSchema.safeParse({ grantId: "grant" }).success).toBe(false);
    expect(removeTagSchema.safeParse({ tagId: "tag" }).success).toBe(false);
  });
});
