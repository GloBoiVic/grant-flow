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

import { findIdentityProjection } from "@/lib/clerk/projections";

describe("findIdentityProjection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUniqueMock.mockResolvedValue({ id: "local-user" });
    organizationFindUniqueMock.mockResolvedValue({ id: "local-org" });
    membershipFindUniqueMock.mockResolvedValue({ role: "MEMBER" });
  });

  it("resolves the user and organization directly, then scopes membership by their composite key", async () => {
    await expect(findIdentityProjection("clerk-user", "clerk-org")).resolves.toEqual({
      userId: "local-user",
      organizationId: "local-org",
      role: "MEMBER",
    });

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user" },
      select: { id: true },
    });
    expect(organizationFindUniqueMock).toHaveBeenCalledWith({
      where: { clerkOrgId: "clerk-org" },
      select: { id: true },
    });
    expect(membershipFindUniqueMock).toHaveBeenCalledWith({
      where: {
        organizationId_userId: {
          organizationId: "local-org",
          userId: "local-user",
        },
      },
      select: { role: true },
    });
  });

  it("fails closed when either direct projection lookup is missing", async () => {
    organizationFindUniqueMock.mockResolvedValue(null);
    await expect(findIdentityProjection("clerk-user", "missing-org")).resolves.toBeNull();
    expect(membershipFindUniqueMock).not.toHaveBeenCalled();
  });

  it("fails closed when the composite membership is missing", async () => {
    membershipFindUniqueMock.mockResolvedValue(null);
    await expect(findIdentityProjection("clerk-user", "clerk-org")).resolves.toBeNull();
  });
});
