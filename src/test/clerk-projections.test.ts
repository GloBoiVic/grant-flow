import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUniqueMock, organizationFindUniqueMock, membershipFindUniqueMock } = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  organizationFindUniqueMock: vi.fn(),
  membershipFindUniqueMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    organization: { findUnique: organizationFindUniqueMock },
    membership: { findUnique: membershipFindUniqueMock },
  },
}));

import { findIdentityProjection, resolveIdentityProjection } from "@/lib/clerk/projections";

describe("findIdentityProjection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  userFindUniqueMock.mockResolvedValue({ id: "local-user", clerkDeletedAt: null, tenantIsolationLockedAt: null });
    organizationFindUniqueMock.mockResolvedValue({ id: "local-org" });
   membershipFindUniqueMock.mockResolvedValue({ role: "MEMBER", roleSyncStatus: "KNOWN", organizationId: "local-org", clerkMembershipId: "membership-1", clerkDeletedAt: null });
  });

  it("resolves the user and organization directly, then scopes membership by its sole user key", async () => {
    await expect(findIdentityProjection("clerk-user", "clerk-org")).resolves.toEqual({
      userId: "local-user",
      organizationId: "local-org",
      role: "MEMBER",
    });

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user" },
      select: { id: true, clerkDeletedAt: true, tenantIsolationLockedAt: true },
    });
    expect(organizationFindUniqueMock).toHaveBeenCalledWith({
      where: { clerkOrgId: "clerk-org" },
      select: { id: true },
    });
    expect(membershipFindUniqueMock).toHaveBeenCalledWith({
      where: {
        userId: "local-user",
      },
        select: { role: true, roleSyncStatus: true, organizationId: true, clerkMembershipId: true, clerkDeletedAt: true },
    });
  });

  it("fails closed when either direct projection lookup is missing", async () => {
    organizationFindUniqueMock.mockResolvedValue(null);
    await expect(findIdentityProjection("clerk-user", "missing-org")).resolves.toBeNull();
    expect(membershipFindUniqueMock).not.toHaveBeenCalled();
  });

  it("fails closed when the bound membership is missing", async () => {
    membershipFindUniqueMock.mockResolvedValue(null);
    await expect(findIdentityProjection("clerk-user", "clerk-org")).resolves.toBeNull();
  });

  it("returns a distinct denial for an unknown persisted role diagnostic", async () => {
    membershipFindUniqueMock.mockResolvedValue({ role: null, roleSyncStatus: "UNKNOWN", organizationId: "local-org", clerkMembershipId: "membership-1", clerkDeletedAt: null });
    await expect(resolveIdentityProjection("clerk-user", "clerk-org")).resolves.toEqual({ status: "unknown-role" });
  });
});
