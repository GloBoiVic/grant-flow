import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorizeAction: vi.fn(),
  revalidatePath: vi.fn(),
  tagCreate: vi.fn(),
  tagFindFirst: vi.fn(),
  grantFindFirst: vi.fn(),
  grantTagFindFirst: vi.fn(),
  grantTagCreateMany: vi.fn(),
  grantTagDeleteMany: vi.fn(),
  grantTagFindMany: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/clerk/authorization", () => ({ authorizeAction: mocks.authorizeAction }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tag: { create: mocks.tagCreate, findFirst: mocks.tagFindFirst },
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
      tag: { findFirst: mocks.tagFindFirst },
      grant: { findFirst: mocks.grantFindFirst },
      grantTag: {
        findFirst: mocks.grantTagFindFirst,
        createMany: mocks.grantTagCreateMany,
        deleteMany: mocks.grantTagDeleteMany,
        findMany: mocks.grantTagFindMany,
      },
    })),
  },
}));

import { assignTagToGrant, createTag, removeTagFromGrant } from "@/app/(authenticated)/(org-required)/grants/tag-actions";

const authorization = { organizationId: "local-org", userId: "local-user", role: "org:member" as const };

describe("tag Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeAction.mockResolvedValue(authorization);
    mocks.tagCreate.mockResolvedValue({ id: "tag-1", name: "Housing" });
    mocks.grantTagFindMany.mockResolvedValue([]);
  });

  it("validates before authorization and derives the normalized name on create", async () => {
    await expect(createTag({ name: "  Housing  " })).resolves.toEqual({
      success: true,
      data: { id: "tag-1", name: "Housing" },
    });
    expect(mocks.tagCreate).toHaveBeenCalledWith({
      data: { organizationId: "local-org", name: "Housing", normalizedName: "housing" },
      select: { id: true, name: true },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/grants");
  });

  it("rejects invalid input before reading the Clerk authorization", async () => {
    await expect(createTag({ name: "   " })).resolves.toMatchObject({ success: false, error: "Invalid tag details." });
    expect(mocks.authorizeAction).not.toHaveBeenCalled();
    expect(mocks.tagCreate).not.toHaveBeenCalled();
  });

  it("returns the duplicate name as a field error", async () => {
    mocks.tagCreate.mockRejectedValue({ code: "P2002" });
    await expect(createTag({ name: "Housing" })).resolves.toEqual({
      success: false,
      error: "A tag with this name already exists.",
      errors: { name: ["A tag with this name already exists."] },
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(["org:member", "org:admin"] as const)("allows the current %s Clerk role", async (role) => {
    mocks.authorizeAction.mockResolvedValue({ ...authorization, role });
    await expect(createTag({ name: "Housing" })).resolves.toMatchObject({ success: true });
    expect(mocks.authorizeAction).toHaveBeenCalledWith();
  });

  it("hides unavailable relations and performs no relation write", async () => {
    mocks.grantFindFirst.mockResolvedValue(null);
    await expect(assignTagToGrant({ grantId: "grant-1", tagId: "tag-1" })).resolves.toEqual({
      success: false,
      error: "Grant or tag not found.",
    });
    expect(mocks.grantTagCreateMany).not.toHaveBeenCalled();
    expect(mocks.grantTagDeleteMany).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("assigns idempotently without a redundant relation write", async () => {
    mocks.grantFindFirst.mockResolvedValue({ id: "grant-1" });
    mocks.tagFindFirst.mockResolvedValue({ id: "tag-1" });
    mocks.grantTagFindFirst.mockResolvedValue({ grantId: "grant-1" });
    await expect(assignTagToGrant({ grantId: "grant-1", tagId: "tag-1" })).resolves.toEqual({ success: true, data: [] });
    expect(mocks.grantFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: "local-org", deletedAt: null, funder: { organizationId: "local-org", deletedAt: null } }),
    }));
    expect(mocks.tagFindFirst).toHaveBeenCalledWith({
      where: { id: "tag-1", organizationId: "local-org", deletedAt: null },
      select: { id: true },
    });
    expect(mocks.grantTagCreateMany).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/grants");
  });

  it("removes idempotently without deleting an absent relation or writing Activity", async () => {
    mocks.grantFindFirst.mockResolvedValue({ id: "grant-1" });
    mocks.tagFindFirst.mockResolvedValue({ id: "tag-1" });
    mocks.grantTagFindFirst.mockResolvedValue(null);
    await expect(removeTagFromGrant({ grantId: "grant-1", tagId: "tag-1" })).resolves.toEqual({ success: true, data: [] });
    expect(mocks.grantTagDeleteMany).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/grants");
  });
});
