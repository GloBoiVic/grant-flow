import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only before imports
const mocks = vi.hoisted(() => ({
  requireAuthorization: vi.fn(),
  grantGroupBy: vi.fn(),
  grantAggregate: vi.fn(),
  grantCount: vi.fn(),
  grantFindFirst: vi.fn(),
  grantFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/clerk/authorization", () => ({ requireAuthorization: mocks.requireAuthorization }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    grant: {
      groupBy: mocks.grantGroupBy,
      aggregate: mocks.grantAggregate,
      count: mocks.grantCount,
      findFirst: mocks.grantFindFirst,
      findMany: mocks.grantFindMany,
    },
  },
}));

import { getDashboard } from "@/lib/queries/dashboard";

describe("dashboard query seam", () => {
  const TODAY = new Date("2026-09-04T00:00:00.000Z");
  const TODAY_PLUS_7 = new Date("2026-09-11T00:00:00.000Z");
  const TODAY_PLUS_30 = new Date("2026-10-04T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue({ organizationId: "org-1", userId: "user-1", clerkUserId: "clerk-1" });
    mocks.grantGroupBy.mockResolvedValue([]);
    mocks.grantAggregate.mockResolvedValue({ _sum: { amountRequested: null, amountAwarded: null } });
    // grantCount called twice (overdue, dueIn7) — use mockResolvedValue sequence handling via implementation
    mocks.grantCount.mockResolvedValue(0);
    mocks.grantFindFirst.mockResolvedValue(null);
    mocks.grantFindMany.mockResolvedValue([]);
  });

  it("scopes status aggregation to authorized organization and active funder", async () => {
    await getDashboard({ today: TODAY });
    expect(mocks.grantGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["status"],
        where: { organizationId: "org-1", deletedAt: null, funder: { organizationId: "org-1", deletedAt: null } },
        _count: { _all: true },
      }),
    );
  });

  it("scopes requested/awarded aggregation to tracked set and serializes null to zero", async () => {
    mocks.grantAggregate.mockResolvedValue({ _sum: { amountRequested: { toString: () => "1234.50" }, amountAwarded: null } });
    const dto = await getDashboard({ today: TODAY });
    expect(mocks.grantAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org-1", deletedAt: null, funder: { organizationId: "org-1", deletedAt: null } },
        _sum: { amountRequested: true, amountAwarded: true },
      }),
    );
    expect(dto.totals.requestedTotal).toBe("1234.50");
    expect(dto.totals.awardedTotal).toBe("0");
    expect(dto.totals.currency).toBe("USD");
  });

  it("zero-fills missing status groups and derives tracked/open pipeline counts", async () => {
    // Only Research=2, Awarded=1 present; others missing should be 0
    mocks.grantGroupBy.mockResolvedValue([
      { status: "Research", _count: { _all: 2 } },
      { status: "Awarded", _count: { _all: 1 } },
    ]);
    const dto = await getDashboard({ today: TODAY });
    // Tracked = sum of grouped counts = 3
    expect(dto.totals.trackedGrants).toBe(3);
    // Open pipeline = Research + Qualified(0) + Planning(0) + Writing(0) + InternalReview(0) + Submitted(0) + Pending(0) = 2
    expect(dto.totals.openPipeline).toBe(2);
    expect(dto.breakdown).toHaveLength(11);
    expect(dto.breakdown[0]).toEqual({ status: "Research", count: 2 });
    expect(dto.breakdown[1]).toEqual({ status: "Qualified", count: 0 });
    expect(dto.breakdown[4]).toEqual({ status: "Internal Review", count: 0 });
    expect(dto.breakdown[5]).toEqual({ status: "Submitted", count: 0 });
    expect(dto.breakdown[7]).toEqual({ status: "Awarded", count: 1 });
    // Verify lifecycle order
    expect(dto.breakdown.map((b) => b.status)).toEqual([
      "Research",
      "Qualified",
      "Planning",
      "Writing",
      "Internal Review",
      "Submitted",
      "Pending",
      "Awarded",
      "Declined",
      "Reporting",
      "Closed",
    ]);
  });

  it("derives open pipeline as sum of Research..Pending (7 statuses)", async () => {
    mocks.grantGroupBy.mockResolvedValue([
      { status: "Research", _count: { _all: 1 } },
      { status: "Qualified", _count: { _all: 1 } },
      { status: "Planning", _count: { _all: 1 } },
      { status: "Writing", _count: { _all: 1 } },
      { status: "InternalReview", _count: { _all: 1 } },
      { status: "Submitted", _count: { _all: 1 } },
      { status: "Pending", _count: { _all: 1 } },
      { status: "Awarded", _count: { _all: 5 } },
    ]);
    const dto = await getDashboard({ today: TODAY });
    expect(dto.totals.trackedGrants).toBe(12);
    expect(dto.totals.openPipeline).toBe(7);
  });

  it("counts overdue with pre-submission statuses and deadline < today", async () => {
    await getDashboard({ today: TODAY });
    // overdue is first count call
    expect(mocks.grantCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org-1",
          deletedAt: null,
          funder: { organizationId: "org-1", deletedAt: null },
          status: { in: ["Research", "Qualified", "Planning", "Writing", "InternalReview"] },
          deadline: { lt: TODAY },
        },
      }),
    );
  });

  it("selects the oldest overdue deadline with the same scope, status filter, and deterministic ordering", async () => {
    mocks.grantCount.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    mocks.grantFindFirst.mockResolvedValue({ deadline: new Date("2026-09-03T00:00:00.000Z") });

    const dto = await getDashboard({ today: TODAY });

    expect(mocks.grantFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        deletedAt: null,
        funder: { organizationId: "org-1", deletedAt: null },
        status: { in: ["Research", "Qualified", "Planning", "Writing", "InternalReview"] },
        deadline: { lt: TODAY },
      },
      select: { deadline: true },
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
    });
    expect(dto.attention.oldestOverdueDays).toBe(1);
  });

  it("returns null when there is no eligible overdue deadline", async () => {
    const dto = await getDashboard({ today: TODAY });

    expect(dto.attention.overdueCount).toBe(0);
    expect(dto.attention.oldestOverdueDays).toBeNull();
  });

  it("returns a plural UTC date-only age for an older overdue deadline", async () => {
    mocks.grantCount.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    mocks.grantFindFirst.mockResolvedValue({ deadline: new Date("2026-08-01T23:59:59.000Z") });

    const dto = await getDashboard({ today: new Date("2026-09-04T18:30:00.000Z") });

    expect(dto.attention.oldestOverdueDays).toBe(34);
  });

  it("counts due-in-7 with inclusive today..today+7 and same pre-submission filter", async () => {
    await getDashboard({ today: TODAY });
    // dueIn7 is second count call
    const calls = mocks.grantCount.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1][0]).toEqual(
      expect.objectContaining({
        where: {
          organizationId: "org-1",
          deletedAt: null,
          funder: { organizationId: "org-1", deletedAt: null },
          status: { in: ["Research", "Qualified", "Planning", "Writing", "InternalReview"] },
          deadline: { gte: TODAY, lte: TODAY_PLUS_7 },
        },
      }),
    );
  });

  it("excludes Submitted/Pending/Awarded/Declined/Reporting/Closed from attention windows", async () => {
    // Verify that the status filter for attention does NOT include those statuses
    await getDashboard({ today: TODAY });
    const overdueWhere = mocks.grantCount.mock.calls[0][0].where;
    const allowed: string[] = overdueWhere.status.in;
    expect(allowed).toEqual(["Research", "Qualified", "Planning", "Writing", "InternalReview"]);
    expect(allowed).not.toContain("Submitted");
    expect(allowed).not.toContain("Pending");
    expect(allowed).not.toContain("Awarded");
    expect(allowed).not.toContain("Declined");
    expect(allowed).not.toContain("Reporting");
    expect(allowed).not.toContain("Closed");
  });

  it("queries upcoming deadlines bounded to pre-submission + next30, ordered deadline asc id asc, take 5", async () => {
    await getDashboard({ today: TODAY });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org-1",
          deletedAt: null,
          funder: { organizationId: "org-1", deletedAt: null },
          status: { in: ["Research", "Qualified", "Planning", "Writing", "InternalReview"] },
          deadline: { gte: TODAY, lte: TODAY_PLUS_30 },
        },
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
          funder: { select: { name: true } },
        },
        orderBy: [{ deadline: "asc" }, { id: "asc" }],
        take: 5,
      }),
    );
  });

  it("serializes upcoming deadlines with display status and YYYY-MM-DD", async () => {
    mocks.grantFindMany.mockResolvedValue([
      { id: "g1", title: "Alpha", status: "InternalReview", deadline: new Date("2026-09-04T00:00:00.000Z"), funder: { name: "Funder A" } },
      { id: "g2", title: "Beta", status: "Research", deadline: new Date("2026-09-11T00:00:00.000Z"), funder: { name: "Funder B" } },
    ]);
    const dto = await getDashboard({ today: TODAY });
    expect(dto.upcoming).toEqual([
      { id: "g1", title: "Alpha", funderName: "Funder A", deadline: "2026-09-04", status: "Internal Review" },
      { id: "g2", title: "Beta", funderName: "Funder B", deadline: "2026-09-11", status: "Research" },
    ]);
  });

  it("keeps DTO serializable (no Date/Decimal objects, Decimals as strings)", async () => {
    mocks.grantGroupBy.mockResolvedValue([{ status: "Research", _count: { _all: 1 } }]);
    mocks.grantAggregate.mockResolvedValue({ _sum: { amountRequested: { toString: () => "100.00" }, amountAwarded: { toString: () => "0.00" } } });
    mocks.grantFindMany.mockResolvedValue([
      { id: "g1", title: "T", status: "Research", deadline: new Date("2026-09-05T00:00:00.000Z"), funder: { name: "F" } },
    ]);
    const dto = await getDashboard({ today: TODAY });
    expect(typeof dto.asOf).toBe("string");
    expect(dto.asOf).toBe("2026-09-04");
    expect(typeof dto.totals.requestedTotal).toBe("string");
    expect(typeof dto.totals.awardedTotal).toBe("string");
    for (const u of dto.upcoming) {
      expect(typeof u.deadline).toBe("string");
      expect(u.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // Ensure JSON round-trip preserves strings
    expect(JSON.parse(JSON.stringify(dto))).toEqual(dto);
  });

  it("treats empty aggregates as zero and renders totals", async () => {
    mocks.grantGroupBy.mockResolvedValue([]);
    mocks.grantAggregate.mockResolvedValue({ _sum: { amountRequested: null, amountAwarded: null } });
    const dto = await getDashboard({ today: TODAY });
    expect(dto.totals.trackedGrants).toBe(0);
    expect(dto.totals.openPipeline).toBe(0);
    expect(dto.totals.requestedTotal).toBe("0");
    expect(dto.totals.awardedTotal).toBe("0");
    expect(dto.breakdown.every((b) => b.count === 0)).toBe(true);
    expect(dto.upcoming).toEqual([]);
  });

  it("converts Prisma InternalReview to display Internal Review in breakdown via grouped counts", async () => {
    mocks.grantGroupBy.mockResolvedValue([{ status: "InternalReview", _count: { _all: 3 } }]);
    const dto = await getDashboard({ today: TODAY });
    const internalReview = dto.breakdown.find((b) => b.status === "Internal Review");
    expect(internalReview?.count).toBe(3);
    expect(dto.breakdown.find((b) => (b.status as string) === "InternalReview")).toBeUndefined();
  });
});
