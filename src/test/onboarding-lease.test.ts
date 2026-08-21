import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  acquireOnboardingLeaseWithDb,
  finalizeOnboardingLeaseWithDb,
  releaseOnboardingLeaseWithDb,
  renewOnboardingLeaseWithDb,
} from "@/lib/clerk/onboarding";

type Row = {
  id: string;
  clerkUserId: string;
  name: string;
  slug: string;
  clerkOrgId: string | null;
  createLeaseToken: string | null;
  createLeaseExpiresAt: Date | null;
};

function database(row: Row): { onboardingClaim: { updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>; findUnique: () => Promise<Row> } } {
  return {
    onboardingClaim: {
      async updateMany({ where, data }) {
        const leaseExpired = row.createLeaseExpiresAt !== null && row.createLeaseExpiresAt <= new Date();
        const leaseAvailable = row.createLeaseToken === null || leaseExpired;
        const unexpired = row.createLeaseExpiresAt !== null && row.createLeaseExpiresAt > (where.createLeaseExpiresAt as { gt: Date })?.gt;
        const matches = where.id === row.id && where.clerkOrgId === null
          && (where.createLeaseToken === undefined || where.createLeaseToken === row.createLeaseToken)
          && (where.createLeaseExpiresAt === undefined || unexpired)
          && (where.OR === undefined || leaseAvailable);
        if (!matches) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
      async findUnique() { return row; },
    },
  };
}

function claim(): Row {
  return { id: "claim_1", clerkUserId: "user_1", name: "Org", slug: "grantflow-org-hash", clerkOrgId: null, createLeaseToken: null, createLeaseExpiresAt: null };
}

describe("durable onboarding lease", () => {
  it("allows only one of two independent clients to acquire", async () => {
    const row = claim();
    const [left, right] = await Promise.all([
      acquireOnboardingLeaseWithDb(database(row), row),
      acquireOnboardingLeaseWithDb(database(row), row),
    ]);
    expect([left.status, right.status].sort()).toEqual(["acquired", "busy"]);
  });

  it("rejects stale owners and permits an expired lease to recover", async () => {
    const row = claim();
    row.createLeaseToken = "stale";
    row.createLeaseExpiresAt = new Date(Date.now() - 1);
    const recovered = await acquireOnboardingLeaseWithDb(database(row), row);
    expect(recovered.status).toBe("acquired");
    if (recovered.status !== "acquired") return;
    await expect(renewOnboardingLeaseWithDb(database(row), row.id, "stale")).resolves.toBe(false);
    await expect(releaseOnboardingLeaseWithDb(database(row), row.id, recovered.leaseToken)).resolves.toBe(true);
  });

  it("finalizes atomically and denies a stale finalizer", async () => {
    const row = claim();
    row.createLeaseToken = "owner";
    row.createLeaseExpiresAt = new Date(Date.now() + 60_000);
    const db = database(row);
    await expect(finalizeOnboardingLeaseWithDb(db, row.id, "wrong", "org_wrong")).resolves.toBeNull();
    await expect(finalizeOnboardingLeaseWithDb(db, row.id, "owner", "org_1")).resolves.toBe("org_1");
    expect(row.clerkOrgId).toBe("org_1");
    await expect(finalizeOnboardingLeaseWithDb(db, row.id, "owner", "org_2")).resolves.toBeNull();
  });
});
