import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorizeAction: vi.fn(),
  revalidatePath: vi.fn(),
  funderFindFirst: vi.fn(),
  funderCreate: vi.fn(),
  funderUpdate: vi.fn(),
  grantFindFirst: vi.fn(),
  grantCreate: vi.fn(),
  grantUpdate: vi.fn(),
  activityCreate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/clerk/authorization", () => ({ authorizeAction: mocks.authorizeAction }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
       funder: { findFirst: mocks.funderFindFirst, create: mocks.funderCreate, update: mocks.funderUpdate },
      grant: { findFirst: mocks.grantFindFirst, create: mocks.grantCreate, update: mocks.grantUpdate },
      activity: { create: mocks.activityCreate },
    })),
  },
}));

import { changeGrantStatus, createFunder, createGrant, editFunder, editGrant } from "@/app/(authenticated)/(org-required)/grants/actions";

const authorization = { organizationId: "local-org", userId: "local-user" };

describe("domain Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeAction.mockResolvedValue(authorization);
  });

  it("creates all maintained Funder fields and revalidates both Funder and Grant surfaces", async () => {
    const created = {
      id: "funder-1",
      name: "New Funder",
      type: "FOUNDATION" as const,
      website: null,
      countyServed: "Local County",
      notes: "Funder notes",
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
    };
    mocks.funderCreate.mockResolvedValue(created);
    mocks.activityCreate.mockResolvedValue({});

    await expect(createFunder({ name: "New Funder", type: "FOUNDATION", website: "", countyServed: "Local County", notes: "Funder notes" })).resolves.toEqual({
      success: true,
      data: {
        ...created,
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
      },
    });

    expect(mocks.funderCreate).toHaveBeenCalledWith({ data: {
      organizationId: "local-org",
      name: "New Funder",
      type: "FOUNDATION",
      website: null,
      countyServed: "Local County",
      notes: "Funder notes",
    } });
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/grants");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/funders");
  });

  it("normalizes a scheme-less Website before persistence and returns the normalized DTO", async () => {
    const created = {
      id: "funder-1",
      name: "New Funder",
      type: "FOUNDATION" as const,
      website: "https://example.com",
      countyServed: null,
      notes: null,
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
    };
    mocks.funderCreate.mockResolvedValue(created);
    mocks.activityCreate.mockResolvedValue({});

    await expect(createFunder({ name: "New Funder", type: "FOUNDATION", website: " example.com " })).resolves.toEqual({
      success: true,
      data: {
        ...created,
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
      },
    });

    expect(mocks.funderCreate).toHaveBeenCalledWith({ data: {
      organizationId: "local-org",
      name: "New Funder",
      type: "FOUNDATION",
      website: "https://example.com",
      countyServed: null,
      notes: null,
    } });
  });

  it("rejects Funder edits with server-owned fields before authorization or persistence", async () => {
    const result = await editFunder({
      funderId: "funder-1",
      name: "Fund",
      type: "FOUNDATION",
      website: null,
      countyServed: null,
      notes: null,
      organizationId: "other-org",
    });

    expect(result).toEqual(expect.objectContaining({ success: false, error: "Invalid funder details." }));
    expect(mocks.authorizeAction).not.toHaveBeenCalled();
    expect(mocks.funderFindFirst).not.toHaveBeenCalled();
    expect(mocks.funderUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it.each(["javascript:alert(1)", "data:text/html,unsafe"]) ("rejects unsafe Funder Websites before authorization or persistence: %s", async (website) => {
    const createResult = await createFunder({ name: "Fund", type: "FOUNDATION", website });
    const editResult = await editFunder({ funderId: "funder-1", name: "Fund", type: "FOUNDATION", website, countyServed: null, notes: null });

    expect(createResult).toEqual(expect.objectContaining({ success: false, error: "Invalid funder details." }));
    expect(editResult).toEqual(expect.objectContaining({ success: false, error: "Invalid funder details." }));
    expect(mocks.authorizeAction).not.toHaveBeenCalled();
    expect(mocks.funderCreate).not.toHaveBeenCalled();
    expect(mocks.funderFindFirst).not.toHaveBeenCalled();
    expect(mocks.funderUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("updates all maintained Funder fields atomically and returns a complete DTO", async () => {
    const updated = {
      id: "funder-1",
      name: "Updated Funder",
      type: "CORPORATION" as const,
      website: "https://updated.example",
      countyServed: "Updated County",
      notes: "Updated notes",
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-21T00:00:00.000Z"),
    };
    mocks.funderFindFirst.mockResolvedValue({ id: "funder-1" });
    mocks.funderUpdate.mockResolvedValue(updated);
    mocks.activityCreate.mockResolvedValue({ id: "activity-1" });

    await expect(editFunder({
      funderId: "funder-1",
      name: " Updated Funder ",
      type: "CORPORATION",
      website: " https://updated.example ",
      countyServed: " Updated County ",
      notes: " Updated notes ",
    })).resolves.toEqual({
      success: true,
      data: {
        ...updated,
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-21T00:00:00.000Z",
      },
    });

    expect(mocks.funderFindFirst).toHaveBeenCalledWith({ where: { id: "funder-1", organizationId: "local-org", deletedAt: null } });
    expect(mocks.funderUpdate).toHaveBeenCalledWith({
      where: { id: "funder-1" },
      data: { name: "Updated Funder", type: "CORPORATION", website: "https://updated.example", countyServed: "Updated County", notes: "Updated notes" },
      select: expect.any(Object),
    });
    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: {
        organizationId: "local-org",
        funderId: "funder-1",
        action: "funder_updated",
        description: "Updated funder Updated Funder.",
        actorId: "local-user",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/funders");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/grants");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(3, "/grants/[grantId]", "page");
  });

  it.each(["cross-org", "soft-deleted"])("returns the same safe failure for a %s Funder", async () => {
    mocks.funderFindFirst.mockResolvedValue(null);

    await expect(editFunder({ funderId: "unavailable", name: "Fund", type: "FOUNDATION", website: null, countyServed: null, notes: null })).resolves.toEqual({
      success: false,
      error: "Funder not found.",
    });

    expect(mocks.funderUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects server-owned fields before authorization or persistence", async () => {
    const result = await createGrant({ funderId: "funder", title: "Grant", status: "Research", organizationId: "other-org" });
    expect(result.success).toBe(false);
    expect(mocks.authorizeAction).not.toHaveBeenCalled();
    expect(mocks.funderFindFirst).not.toHaveBeenCalled();
  });

  it("verifies the supplied funder in the active organization before creating a grant", async () => {
    mocks.funderFindFirst.mockResolvedValue(null);
    const result = await createGrant({ funderId: "other-org-funder", title: "Grant", status: "Research" });
    expect(result).toEqual({ success: false, error: "Funder not found." });
    expect(mocks.funderFindFirst).toHaveBeenCalledWith({ where: { id: "other-org-funder", organizationId: "local-org", deletedAt: null } });
    expect(mocks.grantCreate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("does not mutate or append activity for a same-value status submission", async () => {
    mocks.grantFindFirst.mockResolvedValue({
      id: "grant-1", funderId: "funder-1", title: "Grant", status: "InternalReview", currency: "USD",
      amountRequested: null, amountAwarded: null, deadline: null, decisionDate: null, awardTimeframe: null,
      designation: null, countyServed: null, nextSteps: null, notes: null, ownerId: "local-user", createdById: "local-user",
      createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z"),
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION", website: null, countyServed: null, notes: null, createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z") },
    });
    const result = await changeGrantStatus({ grantId: "grant-1", status: "Internal Review" });
    expect(result.success).toBe(true);
    expect(mocks.grantFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "grant-1", organizationId: "local-org", deletedAt: null }) }));
    expect(mocks.grantUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates both the portfolio and exact workspace after a real status change", async () => {
    mocks.grantFindFirst.mockResolvedValue({
      id: "grant-1", funderId: "funder-1", title: "Grant", status: "Research", currency: "USD",
      amountRequested: null, amountAwarded: null, deadline: null, decisionDate: null, awardTimeframe: null,
      designation: null, countyServed: null, nextSteps: null, notes: null, ownerId: "local-user", createdById: "local-user",
      createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z"),
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION", website: null, countyServed: null, notes: null, createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z") },
    });
    mocks.grantUpdate.mockResolvedValue({
      id: "grant-1", funderId: "funder-1", title: "Grant", status: "Qualified", currency: "USD",
      amountRequested: null, amountAwarded: null, deadline: null, decisionDate: null, awardTimeframe: null,
      designation: null, countyServed: null, nextSteps: null, notes: null, ownerId: "local-user", createdById: "local-user",
      createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-21T00:00:00.000Z"),
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION", website: null, countyServed: null, notes: null, createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z") },
    });
    mocks.activityCreate.mockResolvedValue({ id: "activity-1", action: "status_changed", description: "Changed grant status to Qualified.", metadata: {}, actorId: "local-user", createdAt: new Date("2026-08-21T00:00:00.000Z") });

    await expect(changeGrantStatus({ grantId: "grant-1", status: "Qualified" })).resolves.toMatchObject({ success: true });

    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/grants");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/grants/grant-1");
  });

  it("revalidates both the portfolio and exact workspace after a successful edit", async () => {
    mocks.grantFindFirst.mockResolvedValue({ id: "grant-1" });
    mocks.grantUpdate.mockResolvedValue({
      id: "grant-1", funderId: "funder-1", title: "Updated grant", status: "Research", currency: "USD",
      amountRequested: null, amountAwarded: null, deadline: null, decisionDate: null, awardTimeframe: null,
      designation: null, countyServed: null, nextSteps: null, notes: null, ownerId: "local-user", createdById: "local-user",
      createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-21T00:00:00.000Z"),
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION", website: null, countyServed: null, notes: null, createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z") },
    });
    mocks.activityCreate.mockResolvedValue({ id: "activity-1", action: "grant_updated", description: "Updated grant Updated grant.", metadata: null, actorId: "local-user", createdAt: new Date("2026-08-21T00:00:00.000Z") });

    await expect(editGrant({ grantId: "grant-1", title: "Updated grant" })).resolves.toMatchObject({
      success: true,
      data: { funder: { countyServed: null, notes: null } },
    });

    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/grants");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/grants/grant-1");
    expect(mocks.grantUpdate).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        funder: { select: expect.objectContaining({ countyServed: true, notes: true }) },
      }),
    }));
  });
});
