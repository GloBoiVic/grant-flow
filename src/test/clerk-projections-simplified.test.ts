import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUnique, organizationFindUnique } = vi.hoisted(() => ({ userFindUnique: vi.fn(), organizationFindUnique: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: userFindUnique }, organization: { findUnique: organizationFindUnique } } }));

import { resolveIdentityProjection } from "@/lib/clerk/projections";

describe("resolveIdentityProjection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns local ids only when both Clerk projections exist", async () => {
    userFindUnique.mockResolvedValue({ id: "local-user" });
    organizationFindUnique.mockResolvedValue({ id: "local-org" });
    await expect(resolveIdentityProjection("clerk-user", "clerk-org")).resolves.toEqual({ status: "ready", projection: { userId: "local-user", organizationId: "local-org" } });
    expect(userFindUnique).toHaveBeenCalledWith({ where: { clerkUserId: "clerk-user" }, select: { id: true } });
    expect(organizationFindUnique).toHaveBeenCalledWith({ where: { clerkOrgId: "clerk-org" }, select: { id: true } });
  });

  it.each([
    [null, { id: "org" }, "missing-user"],
    [{ id: "user" }, null, "missing-organization"],
  ])("fails closed for a missing %s projection", async (user, organization, status) => {
    userFindUnique.mockResolvedValue(user);
    organizationFindUnique.mockResolvedValue(organization);
    await expect(resolveIdentityProjection("clerk-user", "clerk-org")).resolves.toEqual({ status });
  });
});
