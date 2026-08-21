import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthorization: vi.fn(),
  funderFindMany: vi.fn(),
  grantFindMany: vi.fn(),
  grantFindFirst: vi.fn(),
  activityFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/clerk/authorization", () => ({ requireAuthorization: mocks.requireAuthorization }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    funder: { findMany: mocks.funderFindMany },
    grant: { findMany: mocks.grantFindMany, findFirst: mocks.grantFindFirst },
    activity: { findMany: mocks.activityFindMany },
  },
}));

import { listActivities } from "@/lib/queries/activities";
import { listFunders } from "@/lib/queries/funders";
import { getGrant, listGrants } from "@/lib/queries/grants";

describe("organization-scoped domain queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue({ organizationId: "local-org" });
    mocks.funderFindMany.mockResolvedValue([]);
    mocks.grantFindMany.mockResolvedValue([]);
    mocks.grantFindFirst.mockResolvedValue(null);
    mocks.activityFindMany.mockResolvedValue([]);
  });

  it("scopes active funder listing to the authorized organization", async () => {
    await listFunders();
    expect(mocks.funderFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { organizationId: "local-org", deletedAt: null },
    }));
  });

  it("scopes grant listing and uses cursor pagination", async () => {
    await listGrants({ cursor: "grant-cursor", limit: 10 });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "local-org",
        deletedAt: null,
        funder: { organizationId: "local-org", deletedAt: null },
      }),
      take: 11,
      cursor: { id: "grant-cursor" },
      skip: 1,
    }));
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
