import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthorization: vi.fn(),
  funderFindMany: vi.fn(),
  grantFindMany: vi.fn(),
  grantFindFirst: vi.fn(),
  activityFindMany: vi.fn(),
  tagFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/clerk/authorization", () => ({ requireAuthorization: mocks.requireAuthorization }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    funder: { findMany: mocks.funderFindMany },
    grant: { findMany: mocks.grantFindMany, findFirst: mocks.grantFindFirst },
    activity: { findMany: mocks.activityFindMany },
    tag: { findMany: mocks.tagFindMany },
  },
}));

import { listActivities } from "@/lib/queries/activities";
import { listFunders } from "@/lib/queries/funders";
import { getGrant, listGrants } from "@/lib/queries/grants";
import { listTags } from "@/lib/queries/tags";

describe("organization-scoped domain queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue({ organizationId: "local-org" });
    mocks.funderFindMany.mockResolvedValue([]);
    mocks.grantFindMany.mockResolvedValue([]);
    mocks.grantFindFirst.mockResolvedValue(null);
    mocks.activityFindMany.mockResolvedValue([]);
    mocks.tagFindMany.mockResolvedValue([]);
  });

  it("scopes active funder listing to the authorized organization", async () => {
    await listFunders();
    expect(mocks.funderFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { organizationId: "local-org", deletedAt: null },
    }));
  });

  it("scopes grant listing and uses fixed offset pagination", async () => {
    await listGrants({ statuses: [], tagIds: [], sort: "deadline", direction: "asc", page: 2 });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "local-org",
        deletedAt: null,
        funder: { organizationId: "local-org", deletedAt: null },
      }),
      take: 51,
      skip: 50,
      orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      select: expect.objectContaining({ grantTags: expect.objectContaining({ where: { tag: { organizationId: "local-org", deletedAt: null } } }) }),
    }));
  });

  it.each([
    ["title", "asc", [{ title: "asc" }, { id: "asc" }]],
    ["title", "desc", [{ title: "desc" }, { id: "desc" }]],
    ["funder", "asc", [{ funder: { name: "asc" } }, { id: "asc" }]],
    ["funder", "desc", [{ funder: { name: "desc" } }, { id: "desc" }]],
    ["status", "asc", [{ status: "asc" }, { id: "asc" }]],
    ["status", "desc", [{ status: "desc" }, { id: "desc" }]],
    ["deadline", "asc", [{ deadline: { sort: "asc", nulls: "last" } }, { id: "asc" }]],
    ["deadline", "desc", [{ deadline: { sort: "desc", nulls: "last" } }, { id: "desc" }]],
    ["requested", "asc", [{ amountRequested: { sort: "asc", nulls: "last" } }, { id: "asc" }]],
    ["requested", "desc", [{ amountRequested: { sort: "desc", nulls: "last" } }, { id: "desc" }]],
    ["awarded", "asc", [{ amountAwarded: { sort: "asc", nulls: "last" } }, { id: "asc" }]],
    ["awarded", "desc", [{ amountAwarded: { sort: "desc", nulls: "last" } }, { id: "desc" }]],
  ] as const)("uses null-last stable ordering for %s %s", async (sort, direction, orderBy) => {
    await listGrants({ statuses: [], tagIds: [], sort, direction, page: 1 });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy }));
  });

  it("filters grants by any selected tag and keeps the tag relation organization-scoped", async () => {
    await listGrants({ statuses: [], tagIds: ["tag-a", "tag-b"], sort: "title", direction: "asc", page: 1 });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        grantTags: { some: { tagId: { in: ["tag-a", "tag-b"] }, tag: { organizationId: "local-org", deletedAt: null } } },
      }),
    }));
  });

  it("uses a 51-row boundary to determine the next page and returns exactly 50 rows", async () => {
    const row = {
      id: "grant-id", funderId: "funder-1", title: "Grant", status: "Research", currency: "USD",
      amountRequested: null, amountAwarded: null, deadline: null, decisionDate: null, awardTimeframe: null,
      designation: null, countyServed: null, nextSteps: null, notes: null, ownerId: null, createdById: "user-1",
      createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z"),
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION" }, grantTags: [],
    };
    mocks.grantFindMany.mockResolvedValue(Array.from({ length: 51 }, (_, index) => ({ ...row, id: `grant-${index}` })));
    await expect(listGrants({ statuses: [], tagIds: [], sort: "title", direction: "desc", page: 2 })).resolves.toMatchObject({ page: 2, hasNextPage: true, hasPreviousPage: true, items: { length: 50 } });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 51, orderBy: [{ title: "desc" }, { id: "desc" }] }));
  });

  it("treats each request as a live view rather than a cross-request snapshot", async () => {
    await listGrants({ statuses: [], tagIds: [], sort: "deadline", direction: "asc", page: 1 });
    await listGrants({ statuses: [], tagIds: [], sort: "deadline", direction: "asc", page: 1 });
    expect(mocks.grantFindMany).toHaveBeenCalledTimes(2);
  });

  it("lists only active tags for the authorized organization", async () => {
    await listTags();
    expect(mocks.tagFindMany).toHaveBeenCalledWith({
      where: { organizationId: "local-org", deletedAt: null },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  });

  it("serializes active assigned tags without exposing join fields", async () => {
    mocks.grantFindMany.mockResolvedValue([{
      id: "grant-1", funderId: "funder-1", title: "Grant", status: "Research", currency: "USD",
      amountRequested: null, amountAwarded: null, deadline: null, decisionDate: null, awardTimeframe: null,
      designation: null, countyServed: null, nextSteps: null, notes: null, ownerId: null, createdById: "user-1",
      createdAt: new Date("2026-08-20T00:00:00.000Z"), updatedAt: new Date("2026-08-20T00:00:00.000Z"),
      funder: { id: "funder-1", name: "Funder", type: "FOUNDATION" },
      grantTags: [{ tag: { id: "tag-1", name: "Housing" } }],
    }]);

    await expect(listGrants()).resolves.toMatchObject({ items: [{ tags: [{ id: "tag-1", name: "Housing" }] }], page: 1 });
  });

  it("returns unavailable grants as missing", async () => {
    expect(await getGrant("other-org-grant")).toBeNull();
    expect(mocks.grantFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "other-org-grant", organizationId: "local-org", deletedAt: null }),
    }));
  });

  it("scopes activity reads and serializes timestamps and metadata", async () => {
    mocks.activityFindMany.mockResolvedValue([{
      id: "activity-1",
      action: "grant_created",
      description: "Created grant",
      metadata: { title: "Program" },
      actorId: "user-1",
      createdAt: new Date("2026-08-20T12:00:00.000Z"),
    }]);

    await expect(listActivities({ grantId: "grant-1" })).resolves.toEqual([{
      id: "activity-1",
      action: "grant_created",
      description: "Created grant",
      metadata: { title: "Program" },
      actorId: "user-1",
      createdAt: "2026-08-20T12:00:00.000Z",
    }]);
    expect(mocks.activityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "local-org",
        grantId: "grant-1",
        grant: { organizationId: "local-org", deletedAt: null },
      }),
    }));
  });
});
