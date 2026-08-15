import { beforeEach, describe, expect, it, vi } from "vitest";

const { membershipFindUniqueMock } = vi.hoisted(() => ({
  membershipFindUniqueMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { membership: { findUnique: membershipFindUniqueMock } },
}));

import type { AuthorizationContext } from "@/lib/clerk/authorization";
import {
  getShellIdentity,
  ShellIdentityProjectionMissingError,
} from "@/lib/queries/shell-identity";

const authorization: AuthorizationContext = {
  clerkUserId: "clerk-user-private",
  clerkOrgId: "clerk-org-private",
  userId: "local-user",
  organizationId: "local-org",
  role: "MEMBER",
};

describe("getShellIdentity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membershipFindUniqueMock.mockResolvedValue({
      organization: { name: "Grant Makers" },
      user: {
        name: "Jane Q. Doe",
        email: "jane@example.com",
        avatarUrl: null,
      },
    });
  });

  it("uses the local composite membership scope and narrow nested selection", async () => {
    await getShellIdentity(authorization);

    expect(membershipFindUniqueMock).toHaveBeenCalledWith({
      where: {
        organizationId_userId: {
          organizationId: "local-org",
          userId: "local-user",
        },
      },
      select: {
        organization: { select: { name: true } },
        user: { select: { name: true, email: true, avatarUrl: true } },
      },
    });
  });

  it("returns only the shell DTO with server-derived initials and a null avatar", async () => {
    await expect(getShellIdentity(authorization)).resolves.toEqual({
      organizationName: "Grant Makers",
      userName: "Jane Q. Doe",
      userEmail: "jane@example.com",
      userAvatarUrl: null,
      userInitials: "JD",
    });
  });

  it.each([
    ["Ada Lovelace", "AL"],
    ["  Grace Hopper  ", "GH"],
    ["Prince", "PR"],
  ])("derives deterministic initials for %s", async (name, initials) => {
    membershipFindUniqueMock.mockResolvedValue({
      organization: { name: "Grant Makers" },
      user: { name, email: "user@example.com", avatarUrl: null },
    });

    await expect(getShellIdentity(authorization)).resolves.toMatchObject({
      userInitials: initials,
    });
  });

  it("maps a missing projection to a dedicated error", async () => {
    membershipFindUniqueMock.mockResolvedValue(null);

    await expect(getShellIdentity(authorization)).rejects.toBeInstanceOf(
      ShellIdentityProjectionMissingError,
    );
  });

  it("propagates Prisma failures without relabeling them", async () => {
    const prismaError = new Error("database unavailable");
    membershipFindUniqueMock.mockRejectedValue(prismaError);

    await expect(getShellIdentity(authorization)).rejects.toBe(prismaError);
  });

  it("does not expose authorization or database identifiers in the DTO", async () => {
    const identity = await getShellIdentity(authorization);

    expect(Object.keys(identity)).toEqual([
      "organizationName",
      "userName",
      "userEmail",
      "userAvatarUrl",
      "userInitials",
    ]);
    expect(JSON.stringify(identity)).not.toContain("clerk-");
    expect(JSON.stringify(identity)).not.toContain("local-");
  });
});
