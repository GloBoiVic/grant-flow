import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { sessionMock, transactionMock, updateManyMock, clerkClientMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  transactionMock: vi.fn(),
  updateManyMock: vi.fn(),
  clerkClientMock: vi.fn(),
}));

vi.mock("@/lib/clerk/session", () => ({ getClerkSessionState: sessionMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: transactionMock, organizationProvisioning: { updateMany: updateManyMock } } }));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: clerkClientMock }));

import { createFirstOrganization } from "@/app/(authenticated)/organization/actions";

describe("onboarding ordering", () => {
  it("keeps an ambiguous Clerk create pending for later correlated webhooks", async () => {
    sessionMock.mockResolvedValue({ authenticated: true, userId: "clerk-user", orgId: null, orgRole: null });
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      user: { findUnique: vi.fn().mockResolvedValue({ id: "local-user", clerkDeletedAt: null, tenantIsolationLockedAt: null, membership: null, organizationProvisioning: { id: "claim-1", status: "PRE_BINDING", clerkOrgId: null } }) },
      organizationProvisioning: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    }));
    clerkClientMock.mockResolvedValue({ organizations: { createOrganization: vi.fn().mockRejectedValue(new Error("network timeout")) } });

    await expect(createFirstOrganization({ name: "Grant Makers" })).resolves.toMatchObject({ success: false, status: "error" });
    expect(updateManyMock).not.toHaveBeenCalledWith(expect.objectContaining({ data: { status: "FAILED", failureCode: "CLERK_CREATE_FAILED" } }));
  });

  it("allows only one concurrent PRE_BINDING to PENDING claim transition", async () => {
    clerkClientMock.mockClear();
    sessionMock.mockResolvedValue({ authenticated: true, userId: "clerk-user", orgId: null, orgRole: null });
    let claimAttempts = 0;
    const claim = { id: "claim-1", status: "PRE_BINDING", clerkOrgId: null };
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      user: { findUnique: vi.fn().mockResolvedValue({
        id: "local-user",
        clerkDeletedAt: null,
        tenantIsolationLockedAt: null,
        membership: null,
        organizationProvisioning: { ...claim },
      }) },
      organizationProvisioning: { updateMany: vi.fn(async () => ({ count: claimAttempts++ === 0 ? 1 : 0 })) },
    }));
    updateManyMock.mockResolvedValue({ count: 1 });
    clerkClientMock.mockResolvedValue({ organizations: { createOrganization: vi.fn().mockResolvedValue({ id: "org-1" }) } });

    const results = await Promise.all([
      createFirstOrganization({ name: "Grant Makers" }),
      createFirstOrganization({ name: "Grant Makers" }),
    ]);

    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(clerkClientMock).toHaveBeenCalledTimes(1);
  });
});
