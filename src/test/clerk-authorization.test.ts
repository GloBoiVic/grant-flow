import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, resolveIdentityProjectionMock, resolveOnboardingEligibilityMock, redirectMock, shellIdentityMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  resolveIdentityProjectionMock: vi.fn(),
  resolveOnboardingEligibilityMock: vi.fn().mockResolvedValue("denied"),
  redirectMock: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
  shellIdentityMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("@/lib/clerk/projections", () => ({
  resolveIdentityProjection: resolveIdentityProjectionMock,
  resolveOnboardingEligibility: resolveOnboardingEligibilityMock,
}));
vi.mock("@/lib/queries/shell-identity", () => ({
  getShellIdentity: shellIdentityMock,
  ShellIdentityProjectionMissingError: class ShellIdentityProjectionMissingError extends Error {},
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { isRoleAtLeast, mapClerkRole } from "@/lib/clerk/roles";
import {
  authorizeAction,
  requireAuthorization,
  requireAuthorizationOrRedirect,
  resolveAuthorization,
  AuthorizationError,
} from "@/lib/clerk/authorization";

import OrganizationRequiredLayout from "@/app/(authenticated)/(org-required)/layout";

describe("Clerk role mapping", () => {
  it.each([
    ["org:admin", "ADMIN"],
    ["org:member", "MEMBER"],
    [undefined, null],
    ["org:unknown", null],
  ])("maps %s to %s", (clerkRole, localRole) => {
    expect(mapClerkRole(clerkRole)).toBe(localRole);
  });

  it.each([
    ["ADMIN", "ADMIN", true],
    ["ADMIN", "MEMBER", true],
    ["MEMBER", "ADMIN", false],
    ["MEMBER", "VIEWER", true],
    ["VIEWER", "MEMBER", false],
    ["VIEWER", "VIEWER", true],
  ])("checks minimum role hierarchy: %s >= %s is %s", (actual, required, allowed) => {
    expect(isRoleAtLeast(actual as "ADMIN" | "MEMBER" | "VIEWER", required as "ADMIN" | "MEMBER" | "VIEWER")).toBe(allowed);
  });
});

describe("requireAuthorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shellIdentityMock.mockResolvedValue({
      organizationName: "Grant Makers",
      userName: "Jane Doe",
      userEmail: "jane@example.com",
      userAvatarUrl: null,
      userInitials: "JD",
    });
    resolveIdentityProjectionMock.mockResolvedValue({
      status: "ready",
      projection: { userId: "local-user", organizationId: "local-org", role: "MEMBER" },
    });
    authMock.mockResolvedValue({
      userId: "clerk-user",
      orgId: "clerk-org",
      orgRole: "org:member",
    });
  });

  it("returns only the authorization context and re-reads auth per call", async () => {
    await expect(requireAuthorization()).resolves.toEqual({
      clerkUserId: "clerk-user",
      clerkOrgId: "clerk-org",
      userId: "local-user",
      organizationId: "local-org",
      role: "MEMBER",
    });
    await requireAuthorization();
    expect(authMock).toHaveBeenCalledTimes(2);
    expect(resolveIdentityProjectionMock).toHaveBeenLastCalledWith(
      "clerk-user",
      "clerk-org",
    );
  });

  it.each([
    [{ userId: null, orgId: null, orgRole: null }, "UNAUTHENTICATED"],
  ])("fails closed for missing session data", async (session, code) => {
    authMock.mockResolvedValue(session);
    await expect(requireAuthorization()).rejects.toMatchObject({ code });
    expect(resolveIdentityProjectionMock).not.toHaveBeenCalled();
  });

  it("distinguishes an authenticated user without an active organization", async () => {
    authMock.mockResolvedValue({ userId: "u", orgId: null, orgRole: "org:member" });
    await expect(requireAuthorization()).rejects.toMatchObject({ code: "PROJECTION_MISSING" });
  });

  it("fails closed for a missing projection", async () => {
    resolveIdentityProjectionMock.mockResolvedValue({ status: "missing-membership" });
    await expect(requireAuthorization()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("exposes projection-pending without creating or mutating records", async () => {
    resolveIdentityProjectionMock.mockResolvedValue({ status: "missing-user" });
    await expect(resolveAuthorization()).resolves.toEqual({ status: "projection-pending" });
  });

  it("fails closed when Clerk and local roles disagree", async () => {
    resolveIdentityProjectionMock.mockResolvedValue({
      status: "ready",
      projection: { userId: "u", organizationId: "o", role: "ADMIN" },
    });
    await expect(requireAuthorization()).rejects.toMatchObject({ code: "ROLE_MISMATCH" });
  });

  it.each([null, undefined, "org:unknown"]) ("denies a missing or unknown Clerk role (%s)", async (orgRole) => {
    authMock.mockResolvedValue({ userId: "clerk-user", orgId: "clerk-org", orgRole });
    await expect(requireAuthorization()).rejects.toMatchObject({ code: "ROLE_MISMATCH" });
    expect(resolveIdentityProjectionMock).toHaveBeenCalledWith("clerk-user", "clerk-org");
  });

  it("denies a session organization that does not match the immutable local binding", async () => {
    resolveIdentityProjectionMock.mockResolvedValue({
      status: "missing-membership",
    });
    authMock.mockResolvedValue({ userId: "clerk-user", orgId: "different-clerk-org", orgRole: "org:member" });
    await expect(requireAuthorization()).rejects.toMatchObject({ code: "PROJECTION_MISSING" });
  });

  it("returns a typed failure for Server Actions", async () => {
    authMock.mockResolvedValue({ userId: null, orgId: null, orgRole: null });
    await expect(authorizeAction()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
      code: "UNAUTHENTICATED",
    });
  });

  it.each([
    [{ userId: null, orgId: null, orgRole: null }, "/login"],
    [{ userId: "u", orgId: null, orgRole: "org:member" }, "/access"],
  ])("redirects route guards safely for session state", async (session, path) => {
    authMock.mockResolvedValue(session);
    await expect(requireAuthorizationOrRedirect()).rejects.toThrow(`REDIRECT:${path}`);
    expect(redirectMock).toHaveBeenCalledWith(path);
  });

  it.each([
    [{ status: "missing-organization" }, "/access"],
    [{ status: "ready", projection: { userId: "u", organizationId: "o", role: "ADMIN" } }, "/access"],
  ])("redirects pending and role-mismatch states to the protected access route", async (projection, path) => {
    resolveIdentityProjectionMock.mockResolvedValue(projection);
    await expect(requireAuthorizationOrRedirect()).rejects.toThrow(`REDIRECT:${path}`);
    expect(redirectMock).toHaveBeenCalledWith(path);
  });
});

describe("organization-required route guard integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveIdentityProjectionMock.mockResolvedValue({
      status: "ready",
      projection: { userId: "local-user", organizationId: "local-org", role: "MEMBER" },
    });
    authMock.mockResolvedValue({
      userId: "clerk-user",
      orgId: "clerk-org",
      orgRole: "org:member",
    });
  });

  it("guards the server-rendered route before returning children", async () => {
    const children = "protected content";
    await expect(OrganizationRequiredLayout({ children })).resolves.toMatchObject({
      props: { children },
    });
    expect(resolveIdentityProjectionMock).toHaveBeenCalledWith("clerk-user", "clerk-org");
    expect(shellIdentityMock).toHaveBeenCalledWith({
      clerkUserId: "clerk-user",
      clerkOrgId: "clerk-org",
      userId: "local-user",
      organizationId: "local-org",
      role: "MEMBER",
    });
  });
});
