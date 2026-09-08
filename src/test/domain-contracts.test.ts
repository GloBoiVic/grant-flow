import { describe, expect, it } from "vitest";

import { createFunderSchema, editFunderSchema } from "@/lib/validations/funder";
import { changeGrantStatusSchema, createGrantSchema, editGrantSchema, GrantStatus } from "@/lib/validations/grant";
import { assignTagSchema, createTagSchema, normalizeTagName, removeTagSchema } from "@/lib/validations/tag";

describe("domain server contracts", () => {
  it("rejects server-owned funder fields", () => {
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", organizationId: "org" }).success).toBe(false);
  });

  it("normalizes all nullable Funder fields and enforces their established limits", () => {
    const result = createFunderSchema.safeParse({
      name: "  Foundation  ",
      type: "FOUNDATION",
      website: "  https://foundation.example  ",
      countyServed: "  Local County  ",
      notes: "  Keep this note.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Foundation",
        type: "FOUNDATION",
        website: "https://foundation.example",
        countyServed: "Local County",
        notes: "Keep this note.",
      });
    }

    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", website: "", countyServed: "", notes: "" })).toMatchObject({
      success: true,
      data: { website: null, countyServed: null, notes: null },
    });
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", countyServed: "x".repeat(201) }).success).toBe(false);
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", notes: "x".repeat(10_001) }).success).toBe(false);
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", website: "not-a-url" }).success).toBe(false);
  });

  it.each(["javascript:alert(1)", "data:text/html,unsafe"]) ("rejects unsafe Website schemes: %s", (website) => {
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", website }).success).toBe(false);
  });

  it.each(["http://foundation.example", "https://foundation.example"]) ("preserves safe Website scheme: %s", (website) => {
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", website })).toMatchObject({
      success: true,
      data: { website },
    });
  });

  it("normalizes scheme-less Website values before validation", () => {
    expect(createFunderSchema.safeParse({ name: "Fund", type: "FOUNDATION", website: "  example.com  " })).toMatchObject({
      success: true,
      data: { website: "https://example.com" },
    });
    expect(editFunderSchema.safeParse({ funderId: "funder", name: "Fund", type: "FOUNDATION", website: "example.com", countyServed: null, notes: null })).toMatchObject({
      success: true,
      data: { website: "https://example.com" },
    });
  });

  it("requires the complete strict edit contract and rejects server-owned fields", () => {
    const valid = { funderId: "funder", name: "Fund", type: "FOUNDATION", website: null, countyServed: null, notes: null };
    expect(editFunderSchema.safeParse(valid).success).toBe(true);
    expect(editFunderSchema.safeParse({ ...valid, organizationId: "org" }).success).toBe(false);
    expect(editFunderSchema.safeParse({ ...valid, updatedAt: new Date() }).success).toBe(false);
    expect(editFunderSchema.safeParse({ ...valid, activity: { action: "funder_updated" } }).success).toBe(false);
    expect(editFunderSchema.safeParse({ funderId: "funder", name: "Fund", type: "FOUNDATION" }).success).toBe(false);
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
