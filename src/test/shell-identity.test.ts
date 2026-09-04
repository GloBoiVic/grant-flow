import { describe, expect, it, vi } from "vitest";

const { organizationFindUniqueMock } = vi.hoisted(() => ({ organizationFindUniqueMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { organization: { findUnique: organizationFindUniqueMock } } }));

import type { AuthorizationContext } from "@/lib/clerk/authorization";
import { getShellIdentity, ShellOrganizationMissingError } from "@/lib/queries/shell-identity";

const authorization: AuthorizationContext = {
  clerkUserId: "clerk-user",
  userId: "local-user",
  organizationId: "local-org",
};

describe("getShellIdentity", () => {
  it("reads only the authorized local organization", async () => {
    organizationFindUniqueMock.mockResolvedValue({ name: "Grant Makers" });

    await expect(getShellIdentity(authorization)).resolves.toEqual({ organizationName: "Grant Makers" });
    expect(organizationFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "local-org" },
      select: { name: true },
    });
  });

  it("fails when the authorized organization is missing", async () => {
    organizationFindUniqueMock.mockResolvedValue(null);

    await expect(getShellIdentity(authorization)).rejects.toBeInstanceOf(ShellOrganizationMissingError);
  });
});
