import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, projectionMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  projectionMock: vi.fn(),
  redirectMock: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("@/lib/clerk/projections", () => ({ resolveIdentityProjection: projectionMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { requireAuthorizationOrRedirect, resolveAuthorization } from "@/lib/clerk/authorization";

describe("simplified Clerk authorization", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requires a recognized role and local projections", async () => {
    authMock.mockResolvedValue({ userId: "u", orgId: "o", orgRole: "org:member" });
    projectionMock.mockResolvedValue({ status: "ready", projection: { userId: "local-u", organizationId: "local-o" } });
    await expect(resolveAuthorization()).resolves.toMatchObject({ status: "authenticated", context: { userId: "local-u", organizationId: "local-o", role: "org:member" } });
  });

  it.each([null, undefined, "org:owner"])("denies missing or unknown role %s", async (orgRole) => {
    authMock.mockResolvedValue({ userId: "u", orgId: "o", orgRole });
    await expect(resolveAuthorization()).resolves.toEqual({ status: "role-mismatch" });
    expect(projectionMock).not.toHaveBeenCalled();
  });

  it("does not switch organizations or accept caller scope", async () => {
    authMock.mockResolvedValue({ userId: "u", orgId: "session-org", orgRole: "org:admin" });
    projectionMock.mockResolvedValue({ status: "ready", projection: { userId: "local-u", organizationId: "session-local-org" } });
    const result = await resolveAuthorization();
    expect(result).toMatchObject({ status: "authenticated", context: { clerkOrgId: "session-org" } });
    expect(projectionMock).toHaveBeenCalledWith("u", "session-org");
  });

  it.each([
    ["unauthenticated", "/login"],
    ["no-active-organization", "/organization"],
    ["projection-pending", "/access"],
    ["role-mismatch", "/access"],
    ["insufficient-role", "/access"],
  ] as const)("routes %s directly to %s", async (status, path) => {
    authMock.mockResolvedValue(
      status === "unauthenticated"
        ? { userId: null, orgId: null, orgRole: null }
        : { userId: "u", orgId: "o", orgRole: "org:member" },
    );
    if (status === "no-active-organization") {
      authMock.mockResolvedValue({ userId: "u", orgId: null, orgRole: "org:member" });
    } else if (status === "projection-pending") {
      projectionMock.mockResolvedValue({ status: "missing-user" });
    } else if (status === "role-mismatch") {
      authMock.mockResolvedValue({ userId: "u", orgId: "o", orgRole: null });
    } else if (status === "insufficient-role") {
      projectionMock.mockResolvedValue({ status: "ready", projection: { userId: "local-u", organizationId: "local-o" } });
    }

    const minimumRole = status === "insufficient-role" ? "org:admin" : undefined;
    await expect(requireAuthorizationOrRedirect(minimumRole)).rejects.toThrow(`REDIRECT:${path}`);
    expect(redirectMock).toHaveBeenCalledWith(path);
  });
});
