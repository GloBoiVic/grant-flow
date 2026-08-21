import { describe, expect, it, vi } from "vitest";

const { organizationFindUniqueMock, userFindUniqueMock } = vi.hoisted(() => ({ organizationFindUniqueMock: vi.fn(), userFindUniqueMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { organization: { findUnique: organizationFindUniqueMock }, user: { findUnique: userFindUniqueMock } } }));

import type { AuthorizationContext } from "@/lib/clerk/authorization";
import { getShellIdentity, ShellIdentityProjectionMissingError } from "@/lib/queries/shell-identity";

const authorization: AuthorizationContext = { clerkUserId: "clerk-user", clerkOrgId: "clerk-org", userId: "local-user", organizationId: "local-org", role: "org:member" };

describe("getShellIdentity", () => {
  it("reads display projections by resolved local ids", async () => {
    organizationFindUniqueMock.mockResolvedValue({ name: "Grant Makers" });
    userFindUniqueMock.mockResolvedValue({ name: "Jane Q. Doe", email: "jane@example.com", avatarUrl: null });
    await expect(getShellIdentity(authorization)).resolves.toEqual({ organizationName: "Grant Makers", userName: "Jane Q. Doe", userEmail: "jane@example.com", userAvatarUrl: null, userInitials: "JD" });
  });

  it("fails closed when either projection is missing", async () => {
    organizationFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue(null);
    await expect(getShellIdentity(authorization)).rejects.toBeInstanceOf(ShellIdentityProjectionMissingError);
  });
});
