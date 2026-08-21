import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, findUnique, updateMany } = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { onboardingClaim: { create, findUnique, updateMany } } }));

import { acquireOnboardingClaim, acquireOnboardingClaimWithDb, onboardingSlug } from "@/lib/clerk/onboarding";
import { recoverOrganizationBySlug, withClerkTimeout } from "@/lib/clerk/onboarding-clerk";

describe("durable onboarding claims", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a stable readable slug within Clerk's limit", () => {
    const first = onboardingSlug("A Very Nice Organization!", "user_123");
    expect(first).toBe(onboardingSlug("A Very Nice Organization!", "user_123"));
    expect(first).toMatch(/^grantflow-a-very-nice-organization-[a-f0-9]{12}$/);
    expect(first.length).toBeLessThanOrEqual(64);
  });

  it("converges independent clients racing on the database unique claim", async () => {
    const claim = { id: "claim_1", clerkUserId: "user_1", name: "Org", slug: "grantflow-org-hash", clerkOrgId: null };
    create.mockRejectedValue({ code: "P2002" });
    findUnique.mockResolvedValue(claim);
    await expect(Promise.all([acquireOnboardingClaim("user_1", "Org"), acquireOnboardingClaim("user_1", "Different")])).resolves.toEqual([claim, claim]);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it("proves two independent clients converge on one shared durable row", async () => {
    let row: { id: string; clerkUserId: string; name: string; slug: string; clerkOrgId: string | null } | undefined;
    const database = () => ({
      onboardingClaim: {
        create: async ({ data }: { data: { clerkUserId: string; name: string; slug: string } }) => {
          if (row) throw { code: "P2002" };
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (row) throw { code: "P2002" };
          row = { id: "claim_shared", ...data, clerkOrgId: null };
          return row;
        },
        findUnique: async () => row,
        updateMany: async () => ({ count: 0 }),
      },
    });
    const [left, right] = await Promise.all([
      acquireOnboardingClaimWithDb(database(), "user_shared", "First name"),
      acquireOnboardingClaimWithDb(database(), "user_shared", "Second name"),
    ]);
    expect(left).toEqual(right);
    expect(left.name).toBe("First name");
  });

  it("bounds a hung Clerk orchestration", async () => {
    await expect(withClerkTimeout(new Promise<never>(() => undefined), 1)).rejects.toThrow("timed out");
  });

  it("distinguishes a definitive slug miss from a transient Clerk failure", async () => {
    const claim = { id: "claim_1", clerkUserId: "user_1", name: "Org", slug: "slug", clerkOrgId: null };
    const notFound = { organizations: { getOrganization: vi.fn().mockRejectedValue({ status: 404 }) } };
    const unavailable = { organizations: { getOrganization: vi.fn().mockRejectedValue(new Error("gateway timeout")) } };
    await expect(recoverOrganizationBySlug(notFound, claim)).resolves.toEqual({ status: "not-found" });
    await expect(recoverOrganizationBySlug(unavailable, claim)).resolves.toEqual({ status: "transient" });
  });
});
