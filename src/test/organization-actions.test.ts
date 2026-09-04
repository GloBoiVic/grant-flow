import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique, create: mocks.userCreate } },
}));

import { createFirstOrganization } from "@/app/(authenticated)/organization/actions";

describe("createFirstOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-user" });
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({ organizationId: "local-org" });
  });

  it("validates the strict name input before reading identity or persistence", async () => {
    await expect(createFirstOrganization({ name: " " })).resolves.toEqual({
      success: false,
      status: "invalid",
      error: "Enter a valid organization name.",
    });
    await expect(createFirstOrganization({ name: "New Org", clerkUserId: "spoofed" })).resolves.toMatchObject({
      success: false,
      status: "invalid",
    });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("returns the unauthenticated action failure", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toEqual({
      success: false,
      error: "Unauthorized",
      code: "UNAUTHENTICATED",
    });
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("returns an existing local organization without renaming it", async () => {
    mocks.userFindUnique.mockResolvedValue({ organizationId: "existing-org" });

    await expect(createFirstOrganization({ name: "A different name" })).resolves.toEqual({
      success: true,
      status: "existing",
      organizationId: "existing-org",
    });
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("creates the local User and Organization in one nested write", async () => {
    await expect(createFirstOrganization({ name: "  New Org  " })).resolves.toEqual({
      success: true,
      status: "created",
      organizationId: "local-org",
    });
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        clerkUserId: "clerk-user",
        organization: { create: { name: "New Org" } },
      },
      select: { organizationId: true },
    });
  });

  it("converges an expected Clerk-user unique race on the winning User", async () => {
    mocks.userCreate.mockRejectedValue({ code: "P2002", meta: { target: ["clerkUserId"] } });
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ organizationId: "winner-org" });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toEqual({
      success: true,
      status: "existing",
      organizationId: "winner-org",
    });
    expect(mocks.userFindUnique).toHaveBeenCalledTimes(2);
  });

  it("returns a retryable result when a unique race winner is not observable", async () => {
    mocks.userCreate.mockRejectedValue({ code: "P2002" });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toEqual({
      success: false,
      status: "retryable",
      error: "Organization setup is still processing. Try again shortly.",
    });
  });

  it("does not convert unexpected persistence failures into authorization results", async () => {
    const error = new Error("database unavailable");
    mocks.userCreate.mockRejectedValue(error);

    await expect(createFirstOrganization({ name: "New Org" })).rejects.toBe(error);
  });
});
