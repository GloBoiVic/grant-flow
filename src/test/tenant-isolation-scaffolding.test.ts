import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.userFindUnique } } }));

import { resolveAuthorization } from "@/lib/clerk/authorization";

describe("tenant authorization scope", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps each Clerk identity to its one local organization", async () => {
    mocks.auth.mockResolvedValueOnce({ userId: "clerk-user-a" }).mockResolvedValueOnce({ userId: "clerk-user-b" });
    mocks.userFindUnique
      .mockResolvedValueOnce({ id: "local-user-a", organizationId: "local-org-a" })
      .mockResolvedValueOnce({ id: "local-user-b", organizationId: "local-org-b" });

    await expect(resolveAuthorization()).resolves.toMatchObject({
      status: "authenticated",
      context: { clerkUserId: "clerk-user-a", userId: "local-user-a", organizationId: "local-org-a" },
    });
    await expect(resolveAuthorization()).resolves.toMatchObject({
      status: "authenticated",
      context: { clerkUserId: "clerk-user-b", userId: "local-user-b", organizationId: "local-org-b" },
    });
    expect(mocks.userFindUnique).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { clerkUserId: "clerk-user-a" } }));
    expect(mocks.userFindUnique).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { clerkUserId: "clerk-user-b" } }));
  });

  it("never accepts a caller organization as an authorization argument", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-a" });
    mocks.userFindUnique.mockResolvedValue({ id: "local-user-a", organizationId: "local-org-a" });

    const result = await resolveAuthorization();
    expect(result).toMatchObject({ status: "authenticated", context: { organizationId: "local-org-a" } });
    expect(mocks.auth).toHaveBeenCalledWith();
    expect(mocks.userFindUnique).not.toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "local-org-b" } }));
  });
});
