import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthorization: vi.fn(),
  grantCount: vi.fn(),
  grantFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/clerk/authorization", () => ({ requireAuthorization: mocks.requireAuthorization }));
vi.mock("@/lib/prisma", () => ({
  prisma: { grant: { count: mocks.grantCount, findMany: mocks.grantFindMany } },
}));

import { getDeadlineView } from "@/lib/queries/deadlines";

describe("deadline view query", () => {
  const TODAY = new Date("2026-09-04T00:00:00.000Z");
  const TODAY_PLUS_30 = new Date("2026-10-04T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue({ organizationId: "org-1", userId: "user-1", clerkUserId: "clerk-1" });
    mocks.grantCount.mockResolvedValue(12);
    mocks.grantFindMany.mockResolvedValue([]);
  });

  it("uses the authorized active Grant/Funder scope and the narrow ordered deadline selection", async () => {
    await getDeadlineView({ today: TODAY });

    expect(mocks.requireAuthorization).toHaveBeenCalledWith();
    expect(mocks.grantCount).toHaveBeenCalledWith({
      where: { organizationId: "org-1", deletedAt: null, funder: { organizationId: "org-1", deletedAt: null } },
    });
    expect(mocks.grantFindMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        deletedAt: null,
        funder: { organizationId: "org-1", deletedAt: null },
        status: { in: ["Research", "Qualified", "Planning", "Writing", "InternalReview"] },
        deadline: { lte: TODAY_PLUS_30 },
      },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        funder: { select: { name: true } },
      },
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
    });

    const deadlineWhere = mocks.grantFindMany.mock.calls[0][0].where.deadline;
    expect(deadlineWhere).not.toHaveProperty("gte");
  });

  it("serializes and partitions fixed date boundaries into disjoint stable groups", async () => {
    mocks.grantFindMany.mockResolvedValue([
      { id: "old", title: "Older", status: "Research", deadline: new Date("2020-01-01T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "overdue", title: "Overdue", status: "Qualified", deadline: new Date("2026-09-03T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "today", title: "Today", status: "Planning", deadline: new Date("2026-09-04T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "tie-a", title: "Tie A", status: "Writing", deadline: new Date("2026-09-05T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "tie-b", title: "Tie B", status: "Research", deadline: new Date("2026-09-05T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "plus7", title: "Plus 7", status: "Qualified", deadline: new Date("2026-09-11T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "plus8", title: "Plus 8", status: "InternalReview", deadline: new Date("2026-09-12T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "plus30", title: "Plus 30", status: "Research", deadline: new Date("2026-10-04T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "plus31", title: "Plus 31", status: "Research", deadline: new Date("2026-10-05T00:00:00.000Z"), funder: { name: "Funder" } },
      { id: "null", title: "No Date", status: "Research", deadline: null, funder: { name: "Funder" } },
    ]);

    const dto = await getDeadlineView({ today: TODAY });

    expect(dto).toEqual({
      asOf: "2026-09-04",
      trackedGrantCount: 12,
      groups: {
        overdue: [
          { id: "old", title: "Older", funderName: "Funder", deadline: "2020-01-01", status: "Research" },
          { id: "overdue", title: "Overdue", funderName: "Funder", deadline: "2026-09-03", status: "Qualified" },
        ],
        dueSoon: [
          { id: "today", title: "Today", funderName: "Funder", deadline: "2026-09-04", status: "Planning" },
          { id: "tie-a", title: "Tie A", funderName: "Funder", deadline: "2026-09-05", status: "Writing" },
          { id: "tie-b", title: "Tie B", funderName: "Funder", deadline: "2026-09-05", status: "Research" },
          { id: "plus7", title: "Plus 7", funderName: "Funder", deadline: "2026-09-11", status: "Qualified" },
        ],
        later: [
          { id: "plus8", title: "Plus 8", funderName: "Funder", deadline: "2026-09-12", status: "Internal Review" },
          { id: "plus30", title: "Plus 30", funderName: "Funder", deadline: "2026-10-04", status: "Research" },
        ],
      },
    });

    const ids = [...dto.groups.overdue, ...dto.groups.dueSoon, ...dto.groups.later].map((item) => item.id);
    expect(ids).toHaveLength(new Set(ids).size);
    expect(ids).not.toContain("plus31");
    expect(ids).not.toContain("null");
    expect(JSON.parse(JSON.stringify(dto))).toEqual(dto);
  });

  it("distinguishes an empty tracked portfolio from a portfolio without eligible rows", async () => {
    mocks.grantCount.mockResolvedValueOnce(0);
    expect((await getDeadlineView({ today: TODAY })).trackedGrantCount).toBe(0);

    mocks.grantCount.mockResolvedValueOnce(3);
    expect((await getDeadlineView({ today: TODAY })).trackedGrantCount).toBe(3);
  });
});
