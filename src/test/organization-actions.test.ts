import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, clerkClientMock, claimMock, leaseMock, finalizeMock, renewMock, releaseMock, recoverMock, matchesMock } = vi.hoisted(() => ({ authMock: vi.fn(), clerkClientMock: vi.fn(), claimMock: vi.fn(), leaseMock: vi.fn(), finalizeMock: vi.fn(), renewMock: vi.fn(), releaseMock: vi.fn(), recoverMock: vi.fn(), matchesMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: clerkClientMock, auth: authMock }));
vi.mock("@/lib/clerk/session", () => ({ getClerkSessionState: authMock }));
vi.mock("@/lib/clerk/onboarding", () => ({ acquireOnboardingClaim: claimMock, acquireOnboardingLease: leaseMock, finalizeOnboardingLease: finalizeMock, renewOnboardingLease: renewMock, releaseOnboardingLease: releaseMock }));
vi.mock("@/lib/clerk/onboarding-clerk", () => ({ recoverOrganizationBySlug: recoverMock, clerkOrganizationMatchesClaim: matchesMock, withClerkTimeout: (operation: Promise<unknown>) => operation }));

import { createFirstOrganization } from "@/app/(authenticated)/organization/actions";

describe("createFirstOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ authenticated: true, userId: "user_1", orgId: null, orgRole: null });
    claimMock.mockResolvedValue({ id: "claim_1", clerkUserId: "user_1", name: "New Org", slug: "grantflow-new-org-hash", clerkOrgId: null });
    leaseMock.mockResolvedValue({ status: "acquired", claim: { id: "claim_1", clerkUserId: "user_1", name: "New Org", slug: "grantflow-new-org-hash", clerkOrgId: null }, leaseToken: "lease_1" });
    finalizeMock.mockResolvedValue(true);
    renewMock.mockResolvedValue(true);
    releaseMock.mockResolvedValue(true);
    recoverMock.mockResolvedValue({ status: "not-found" });
  });

  it("validates before reading the session", async () => {
    await expect(createFirstOrganization({ name: " " })).resolves.toEqual({ success: false, status: "invalid", error: "Enter a valid organization name." });
    expect(authMock).not.toHaveBeenCalled();
  });

  it("denies unauthenticated, active-organization, and existing-membership requests", async () => {
    authMock.mockResolvedValueOnce({ authenticated: false, userId: null, orgId: null, orgRole: null });
    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "unauthenticated" });

    authMock.mockResolvedValueOnce({ authenticated: true, userId: "user_1", orgId: "org_1", orgRole: "org:member" });
    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "denied" });

    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: vi.fn().mockResolvedValue({ data: [{ id: "membership_1" }] }) } });
    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "denied" });
    expect(clerkClientMock).toHaveBeenCalledTimes(1);
  });

  it("returns retryable when Clerk setup is uncertain", async () => {
    clerkClientMock.mockRejectedValue(new Error("unavailable"));
    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "retryable" });
  });

  it("uses the durable claim and Clerk slug/metadata to create", async () => {
    const getMemberships = vi.fn().mockResolvedValue({ data: [] });
    const createOrganization = vi.fn().mockResolvedValue({ id: "org_1", slug: "grantflow-new-org-hash", createdBy: "user_1", privateMetadata: { grantflowOnboardingClaimId: "claim_1", grantflowOnboardingUserId: "user_1" } });
    matchesMock.mockImplementation((organization: { id: string }, claim: { id: string }) => organization.id === "org_1" && claim.id === "claim_1");
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: getMemberships }, organizations: { createOrganization } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toEqual({ success: true, status: "pending", clerkOrgId: "org_1" });
    expect(getMemberships).toHaveBeenCalledTimes(1);
    expect(createOrganization).toHaveBeenCalledTimes(1);
    expect(createOrganization).toHaveBeenCalledWith({ name: "New Org", slug: "grantflow-new-org-hash", createdBy: "user_1", privateMetadata: { grantflowOnboardingClaimId: "claim_1", grantflowOnboardingUserId: "user_1" } });
  });

  it("denies a Clerk organization whose proof does not match the claim", async () => {
    const createOrganization = vi.fn().mockResolvedValue({ id: "org_wrong", slug: "grantflow-new-org-hash", createdBy: "another-user", privateMetadata: {} });
    const getMemberships = vi.fn().mockResolvedValue({ data: [] });
    matchesMock.mockReturnValue(false);
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: getMemberships }, organizations: { createOrganization } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "denied" });
    expect(recoverMock).toHaveBeenCalledTimes(1);
    expect(finalizeMock).not.toHaveBeenCalled();
  });

  it("recovers a completed Clerk create before attempting another create", async () => {
    const recovered = { id: "org_1", slug: "grantflow-new-org-hash" };
    recoverMock.mockResolvedValue({ status: "found", organization: recovered });
    matchesMock.mockReturnValue(true);
    const createOrganization = vi.fn();
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: vi.fn().mockResolvedValue({ data: [] }) }, organizations: { createOrganization } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toEqual({ success: true, status: "pending", clerkOrgId: "org_1" });
    expect(finalizeMock).toHaveBeenCalledWith("claim_1", "lease_1", "org_1");
    expect(createOrganization).not.toHaveBeenCalled();
  });

  it("denies unrelated and multiple memberships before recovery", async () => {
    const getMemberships = vi.fn().mockResolvedValue({ data: [
      { organization: { id: "org_unrelated", slug: "other" } },
      { organization: { id: "org_1", slug: "grantflow-new-org-hash" } },
    ] });
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: getMemberships }, organizations: { getOrganization: vi.fn() } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "denied" });
    expect(recoverMock).not.toHaveBeenCalled();
    expect(finalizeMock).not.toHaveBeenCalled();
  });

  it("returns retryable when membership inventory times out or errors", async () => {
    const getMemberships = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockRejectedValueOnce(new Error("gateway"));
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: getMemberships }, organizations: { createOrganization: vi.fn() } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "retryable" });
    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "retryable" });
    expect(recoverMock).not.toHaveBeenCalled();
  });

  it("inventories memberships before verified claim recovery", async () => {
    const events: string[] = [];
    const getMemberships = vi.fn().mockImplementation(async () => { events.push("memberships"); return { data: [{ organization: { id: "org_1", slug: "grantflow-new-org-hash" } }] }; });
    recoverMock.mockImplementation(async () => { events.push("recovery"); return { status: "found", organization: { id: "org_1", slug: "grantflow-new-org-hash" } }; });
    matchesMock.mockReturnValue(true);
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: getMemberships }, organizations: { createOrganization: vi.fn() } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toEqual({ success: true, status: "pending", clerkOrgId: "org_1" });
    expect(events).toEqual(["memberships", "recovery"]);
    expect(finalizeMock).toHaveBeenCalledWith("claim_1", "lease_1", "org_1");
  });

  it("returns retryable when the slug lookup is transient, after inventory", async () => {
    recoverMock.mockResolvedValue({ status: "transient" });
    const getMemberships = vi.fn().mockResolvedValue({ data: [] });
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: getMemberships }, organizations: { createOrganization: vi.fn() } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "retryable" });
    expect(getMemberships).toHaveBeenCalledTimes(1);
    expect(clerkClientMock).toHaveBeenCalledTimes(1);
  });

  it("returns retryable after an ambiguous create and a definitive missing recovery", async () => {
    recoverMock.mockResolvedValueOnce({ status: "not-found" }).mockResolvedValueOnce({ status: "not-found" });
    const createOrganization = vi.fn().mockRejectedValue(new Error("request lost"));
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: vi.fn().mockResolvedValue({ data: [] }) }, organizations: { createOrganization } });

    await expect(createFirstOrganization({ name: "New Org" })).resolves.toMatchObject({ status: "retryable" });
    expect(recoverMock).toHaveBeenCalledTimes(2);
  });

  it("runs concurrent actions through one durable claim and one Clerk create", async () => {
    let boundOrg: string | null = null;
    claimMock.mockImplementation(async () => ({ id: "claim_1", clerkUserId: "user_1", name: "New Org", slug: "grantflow-new-org-hash", clerkOrgId: boundOrg }));
    let leaseCalls = 0;
    leaseMock.mockImplementation(async () => { leaseCalls += 1; return leaseCalls === 1 ? { status: "acquired", claim: { id: "claim_1", clerkUserId: "user_1", name: "New Org", slug: "grantflow-new-org-hash", clerkOrgId: null }, leaseToken: "lease_1" } : { status: "busy" }; });
    const createOrganization = vi.fn().mockImplementation(async () => ({ id: "org_1", slug: "grantflow-new-org-hash", createdBy: "user_1", privateMetadata: { grantflowOnboardingClaimId: "claim_1", grantflowOnboardingUserId: "user_1" } }));
    matchesMock.mockReturnValue(true);
    finalizeMock.mockImplementation(async (_id: string, _token: string, orgId: string) => { boundOrg = orgId; return true; });
    clerkClientMock.mockResolvedValue({ users: { getOrganizationMembershipList: vi.fn().mockResolvedValue({ data: [] }) }, organizations: { createOrganization } });

    await expect(Promise.all([
      createFirstOrganization({ name: "New Org" }),
      createFirstOrganization({ name: "New Org" }),
    ])).resolves.toEqual([
      { success: true, status: "pending", clerkOrgId: "org_1" },
      { success: false, status: "retryable", error: "Organization setup is still processing. Try again shortly." },
    ]);
    expect(createOrganization).toHaveBeenCalledTimes(1);
  });
});
