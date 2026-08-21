import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, projectionMock } = vi.hoisted(() => ({ authMock: vi.fn(), projectionMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("@/lib/clerk/projections", () => ({ resolveIdentityProjection: projectionMock }));

import { resolveAuthorization } from "@/lib/clerk/authorization";

describe("tenant authorization scope", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps two tenant sessions scoped to their matching projections", async () => {
    projectionMock.mockImplementation(async (clerkUserId: string, clerkOrgId: string) => ({
      status: "ready",
      projection: {
        userId: clerkUserId === "clerk-user-a" ? "local-user-a" : "local-user-b",
        organizationId: clerkOrgId === "clerk-org-a" ? "local-org-a" : "local-org-b",
      },
    }));

    authMock.mockResolvedValue({ userId: "clerk-user-a", orgId: "clerk-org-a", orgRole: "org:member" });
    await expect(resolveAuthorization()).resolves.toMatchObject({
      status: "authenticated",
      context: { clerkOrgId: "clerk-org-a", organizationId: "local-org-a" },
    });

    authMock.mockResolvedValue({ userId: "clerk-user-b", orgId: "clerk-org-b", orgRole: "org:member" });
    await expect(resolveAuthorization()).resolves.toMatchObject({
      status: "authenticated",
      context: { clerkOrgId: "clerk-org-b", organizationId: "local-org-b" },
    });

    expect(projectionMock).toHaveBeenNthCalledWith(1, "clerk-user-a", "clerk-org-a");
    expect(projectionMock).toHaveBeenNthCalledWith(2, "clerk-user-b", "clerk-org-b");
  });

  it("cannot resolve org B while the session is in org A, and rejects client org IDs", async () => {
    authMock.mockResolvedValue({ userId: "clerk-user-a", orgId: "clerk-org-a", orgRole: "org:member" });
    projectionMock.mockResolvedValue({
      status: "ready",
      projection: { userId: "local-user-a", organizationId: "local-org-a" },
    });

    await expect(resolveAuthorization()).resolves.toMatchObject({
      status: "authenticated",
      context: { organizationId: "local-org-a" },
    });
    expect(projectionMock).toHaveBeenCalledWith("clerk-user-a", "clerk-org-a");
    expect(projectionMock).not.toHaveBeenCalledWith("clerk-user-a", "clerk-org-b");

    // The only resolver argument is a minimum role. A client organization ID
    // is not accepted as scope; it fails closed as an invalid role requirement
    // rather than replacing the session organization.
    await expect(resolveAuthorization("clerk-org-b" as never)).resolves.toEqual({ status: "role-mismatch" });
    expect(projectionMock).toHaveBeenCalledTimes(1);
  });
});
