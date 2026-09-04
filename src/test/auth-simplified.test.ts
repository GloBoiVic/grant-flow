import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.userFindUnique } } }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  authorizeAction,
  requireAuthorizationOrRedirect,
  resolveAuthorization,
} from "@/lib/clerk/authorization";

describe("local tenancy authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue({ id: "local-user", organizationId: "local-org" });
  });

  it("returns unauthenticated without querying local tenancy", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    await expect(resolveAuthorization()).resolves.toEqual({ status: "unauthenticated" });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("resolves a local user by Clerk userId and ignores Clerk organization fields", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user", unrelatedClerkSessionData: "ignored" });

    await expect(resolveAuthorization()).resolves.toEqual({
      status: "authenticated",
      context: { clerkUserId: "clerk-user", userId: "local-user", organizationId: "local-org" },
    });
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user" },
      select: { id: true, organizationId: true },
    });
  });

  it("returns missing-local-user when the Clerk user has not onboarded", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user" });
    mocks.userFindUnique.mockResolvedValue(null);

    await expect(resolveAuthorization()).resolves.toEqual({ status: "missing-local-user" });
  });

  it.each([
    ["unauthenticated", { userId: null }, "/login"],
    ["missing-local-user", { userId: "clerk-user" }, "/organization"],
  ] as const)("redirects %s to %s", async (_status, session, path) => {
    mocks.auth.mockResolvedValue(session);
    if (session.userId) mocks.userFindUnique.mockResolvedValue(null);

    await expect(requireAuthorizationOrRedirect()).rejects.toThrow(`REDIRECT:${path}`);
    expect(mocks.redirect).toHaveBeenCalledWith(path);
  });

  it("returns the same failure contract to Server Actions", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user" });
    mocks.userFindUnique.mockResolvedValue(null);

    await expect(authorizeAction()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
      code: "MISSING_LOCAL_USER",
    });
  });
});
