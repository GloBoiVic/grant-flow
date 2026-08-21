import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorizeAction: vi.fn(),
  revalidatePath: vi.fn(),
  funderFindFirst: vi.fn(),
  funderCreate: vi.fn(),
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
      funder: { findFirst: mocks.funderFindFirst, create: mocks.funderCreate },
      grant: { findFirst: mocks.grantFindFirst, create: mocks.grantCreate, update: mocks.grantUpdate },
      activity: { create: mocks.activityCreate },
    })),
  },
}));

import { changeGrantStatus, createGrant } from "@/app/(authenticated)/(org-required)/grants/actions";

const authorization = { organizationId: "local-org", userId: "local-user" };

describe("domain Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeAction.mockResolvedValue(authorization);
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
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION", website: null, createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z") },
    });
    const result = await changeGrantStatus({ grantId: "grant-1", status: "Internal Review" });
    expect(result.success).toBe(true);
    expect(mocks.grantFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "grant-1", organizationId: "local-org", deletedAt: null }) }));
    expect(mocks.grantUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
