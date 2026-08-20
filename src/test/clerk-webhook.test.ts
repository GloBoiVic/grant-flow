import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { IdentityConflictError, parseClerkWebhook, processClerkWebhook, type IdentityWebhookDb } from "@/lib/clerk/webhook";

const organization = { id: "org_1", name: "Org", slug: "org", created_by: "user_1" };
const user = { id: "user_1", first_name: "A", last_name: "User", image_url: "", primary_email_address_id: "email_1", email_addresses: [{ id: "email_1", email_address: "a@example.com" }] };
const membership = { id: "mem_1", role: "org:admin", organization, public_user_data: { user_id: "user_1" } };
const event = (type: string, data: unknown) => ({ type, object: "event", data });

function db(overrides: Record<string, unknown> = {}): IdentityWebhookDb {
  const userRecord = { id: "u", tenantIsolationLockedAt: null as Date | null, clerkDeletedAt: null as Date | null };
  let membershipRecord: { organizationId: string; clerkMembershipId: string; clerkDeletedAt: Date | null; role: string | null; roleSyncStatus: string; clerkRoleUpdatedAt: Date | null } | null = null;
  const value = {
    user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u", tenantIsolationLockedAt: null, clerkDeletedAt: null, membership: null, organizationProvisioning: null }), update: vi.fn(), updateMany: vi.fn() },
    organization: { upsert: vi.fn().mockResolvedValue({ id: "o" }), findUnique: vi.fn().mockResolvedValue({ id: "o" }), update: vi.fn() },
    membership: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) },
    organizationProvisioning: { findUnique: vi.fn().mockResolvedValue({ status: "PENDING", clerkOrgId: "org_1" }), update: vi.fn(), upsert: vi.fn() },
    userDeletionFence: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
    ...overrides,
  };
  if (!overrides.user) {
    value.user.findUnique.mockImplementation(async () => userRecord);
     value.user.update.mockImplementation(async ({ data }: { data: Partial<typeof userRecord> }) => Object.assign(userRecord, data));
     value.user.updateMany.mockImplementation(async ({ data }: { data: Partial<typeof userRecord> }) => {
       if (!userRecord.clerkDeletedAt || userRecord.clerkDeletedAt < (data.clerkDeletedAt as Date)) Object.assign(userRecord, data);
       return { count: 1 };
     });
  }
  if (!overrides.membership) {
    value.membership.findUnique.mockImplementation(async () => membershipRecord);
    value.membership.create.mockImplementation(async ({ data }: { data: NonNullable<typeof membershipRecord> }) => {
      membershipRecord = { ...data };
      return membershipRecord;
    });
    value.membership.update.mockImplementation(async ({ data }: { data: Partial<NonNullable<typeof membershipRecord>> }) => {
      if (membershipRecord) Object.assign(membershipRecord, data);
    });
  }
  value.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(value));
  return value as unknown as IdentityWebhookDb;
}

describe("permanent work identity webhook policy", () => {
  it("validates supported identity payloads and ignores unsupported notifications", () => {
    expect(parseClerkWebhook(event("user.created", user))).toBeTruthy();
    expect(parseClerkWebhook(event("user.deleted", { id: "user_1" }))).toBeTruthy();
    expect(parseClerkWebhook(event("session.created", {}))).toBeNull();
  });

  it("creates a pre-binding claim in the same transaction as a new User projection", async () => {
    const value = db({ user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue(null), update: vi.fn(), updateMany: vi.fn() } });
    await processClerkWebhook(value, event("user.created", user));

    expect(value.$transaction).toHaveBeenCalled();
    expect(value.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        clerkUserId: "user_1",
        organizationProvisioning: { create: { status: "PRE_BINDING" } },
      }),
    }));
  });

  it("persists a deletion fence before a missing User projection can be recreated", async () => {
    let fenced = false;
    const value = db({
      user: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
      userDeletionFence: { findUnique: vi.fn(async () => fenced ? { id: "fence" } : null), create: vi.fn(async () => { fenced = true; }), update: vi.fn() },
    });

    await processClerkWebhook(value, event("user.deleted", { id: "user_1", deleted_at: "2026-08-20T12:00:00.000Z" }));
    expect(value.userDeletionFence.create).toHaveBeenCalledWith({ data: { clerkUserId: "user_1", deletedAt: new Date("2026-08-20T12:00:00.000Z") } });
    await processClerkWebhook(value, event("user.created", user));
    expect(value.user.upsert).not.toHaveBeenCalled();
  });

  it("claims an existing never-bound user only when it is safe", async () => {
    const value = db({
      user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u", clerkDeletedAt: null, tenantIsolationLockedAt: null, membership: null, organizationProvisioning: null }), update: vi.fn(), updateMany: vi.fn() },
      organizationProvisioning: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    });
    await processClerkWebhook(value, event("user.updated", user));
    expect(value.organizationProvisioning.create).toHaveBeenCalledWith({ data: { userId: "u", status: "PRE_BINDING" } });
  });

  it("does not claim a bound, revoked, or locked existing user", async () => {
    for (const state of [
      { clerkDeletedAt: new Date(), tenantIsolationLockedAt: null, membership: null },
      { clerkDeletedAt: null, tenantIsolationLockedAt: new Date(), membership: null },
      { clerkDeletedAt: null, tenantIsolationLockedAt: null, membership: { id: "membership" } },
    ]) {
      const value = db({
        user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u", ...state, organizationProvisioning: null }), update: vi.fn(), updateMany: vi.fn() },
        organizationProvisioning: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
      });
      await processClerkWebhook(value, event("user.updated", user));
      expect(value.organizationProvisioning.create).not.toHaveBeenCalled();
    }
  });

  it("creates the first membership only when the durable claim matches", async () => {
    const value = db();
    await processClerkWebhook(value, event("organizationMembership.created", membership));
    expect(value.membership.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "u", organizationId: "o", clerkMembershipId: "mem_1" }) });
    expect(value.organizationProvisioning.update).toHaveBeenCalledWith({ where: { userId: "u" }, data: { status: "COMPLETED" } });
  });

  it("locks rather than binding an unclaimed membership", async () => {
    const value = db({ organizationProvisioning: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn(), upsert: vi.fn() } });
    await expect(processClerkWebhook(value, event("organizationMembership.created", membership))).resolves.toEqual({ status: "conflict", code: "UNCLAIMED_MEMBERSHIP" });
    expect(value.user.update).toHaveBeenCalledWith({ where: { id: "u" }, data: { tenantIsolationLockedAt: expect.any(Date) } });
    expect(value.membership.create).not.toHaveBeenCalled();
  });

  it("binds an organization only when its private metadata names the pending claim", async () => {
    const value = db({
      organizationProvisioning: {
        findUnique: vi.fn().mockResolvedValue({ id: "claim-1", userId: "u", status: "PENDING", clerkOrgId: null }),
        updateMany: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    });

    await processClerkWebhook(value, event("organization.created", {
      ...organization,
      private_metadata: { grantflowOnboardingClaimId: "claim-1" },
    }));

    expect(value.organizationProvisioning.updateMany).toHaveBeenCalledWith({
      where: { id: "claim-1", status: "PENDING", clerkOrgId: null },
      data: { clerkOrgId: "org_1" },
    });
    expect(value.organization.update).toHaveBeenCalledWith({ where: { id: "o" }, data: { creatorId: "u" } });
  });

  it("binds valid correlated organization and membership events after an ambiguous create", async () => {
    const value = db({
      organizationProvisioning: {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ id: "claim-1", userId: "u", status: "PENDING", clerkOrgId: null })
          .mockResolvedValue({ id: "claim-1", userId: "u", status: "PENDING", clerkOrgId: "org_1" }),
        updateMany: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    });

    await processClerkWebhook(value, event("organization.created", { ...organization, private_metadata: { grantflowOnboardingClaimId: "claim-1" } }));
    await processClerkWebhook(value, event("organizationMembership.created", membership));

    expect(value.membership.create).toHaveBeenCalledWith({ data: expect.objectContaining({ clerkMembershipId: "mem_1", organizationId: "o" }) });
  });

  it("does not correlate an organization through creator email or missing private metadata", async () => {
    const value = db({
      organizationProvisioning: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    });

    await processClerkWebhook(value, event("organization.created", organization));

    expect(value.organizationProvisioning.findUnique).not.toHaveBeenCalled();
    expect(value.organization.update).not.toHaveBeenCalled();
  });

  it("locks every second or replacement membership without changing the binding", async () => {
    const value = db({ membership: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn().mockResolvedValue({ organizationId: "o", clerkMembershipId: "old", clerkDeletedAt: null }) } });
    await expect(processClerkWebhook(value, event("organizationMembership.created", membership))).resolves.toEqual({ status: "conflict", code: "SECOND_MEMBERSHIP" });
    expect(value.user.update).toHaveBeenCalled();
    expect(value.membership.update).not.toHaveBeenCalled();
  });

  it("permanently revokes the exact incarnation and ignores delayed recreation", async () => {
    const repositoryMembership = { organizationId: "o", clerkMembershipId: "mem_1", clerkDeletedAt: null as Date | null, role: "ADMIN", roleSyncStatus: "KNOWN", clerkRoleUpdatedAt: null as Date | null };
    const value = db({
      membership: {
        create: vi.fn(),
        update: vi.fn(async ({ data }: { data: Partial<typeof repositoryMembership> }) => Object.assign(repositoryMembership, data)),
        findUnique: vi.fn().mockResolvedValue(repositoryMembership),
      },
    });
    await processClerkWebhook(value, event("organizationMembership.deleted", membership));
    expect(value.membership.update).toHaveBeenCalledWith({ where: { userId: "u" }, data: { clerkDeletedAt: expect.any(Date) } });
    await processClerkWebhook(value, event("organizationMembership.created", membership));
    expect(value.membership.create).not.toHaveBeenCalled();
    expect(value.membership.update).toHaveBeenCalledTimes(1);
    expect(value.membership.findUnique).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: "u" } }));
    expect(repositoryMembership.clerkDeletedAt).toEqual(expect.any(Date));
  });

  it("does not move a fenced revocation timestamp backwards", async () => {
    const currentDeletion = new Date("2026-08-20T12:00:00.000Z");
    const value = db({
      membership: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({
          organizationId: "o",
          clerkMembershipId: "mem_1",
          clerkDeletedAt: currentDeletion,
        }),
      },
    });

    await processClerkWebhook(value, event("organizationMembership.deleted", {
      ...membership,
      deleted_at: Math.floor(new Date("2026-08-19T12:00:00.000Z").getTime() / 1000),
    }));

    expect(value.membership.update).not.toHaveBeenCalled();
  });

  it("fences duplicate, stale, and newer user deletion events by signed event time", async () => {
    const value = db();
    const deletion = { id: "user_1", deleted_at: "2026-08-20T12:00:00.000Z" };
    await processClerkWebhook(value, event("user.deleted", deletion));
    await processClerkWebhook(value, event("user.deleted", deletion));
    await processClerkWebhook(value, event("user.deleted", { ...deletion, deleted_at: "2026-08-19T12:00:00.000Z" }));
    await processClerkWebhook(value, event("user.deleted", { ...deletion, deleted_at: "2026-08-21T12:00:00.000Z" }));

     expect(value.user.updateMany).toHaveBeenCalledTimes(4);
     expect(value.user.updateMany).toHaveBeenLastCalledWith({
       where: { clerkUserId: "user_1", OR: [{ clerkDeletedAt: null }, { clerkDeletedAt: { lt: new Date("2026-08-21T12:00:00.000Z") } }] },
       data: { clerkDeletedAt: new Date("2026-08-21T12:00:00.000Z") },
     });
  });

  it("persists an unknown role as a diagnostic denial, never as VIEWER or the prior role", async () => {
    const value = db({
      membership: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({ organizationId: "o", clerkMembershipId: "mem_1", clerkDeletedAt: null, role: "ADMIN", roleSyncStatus: "KNOWN", clerkRoleUpdatedAt: null }),
      },
    });

    await processClerkWebhook(value, event("organizationMembership.updated", { ...membership, role: "org:owner", updated_at: Math.floor(new Date("2026-08-20T12:00:00Z").getTime() / 1000) }));

    expect(value.membership.update).toHaveBeenCalledWith({
      where: { userId: "u" },
      data: { role: null, roleSyncStatus: "UNKNOWN", clerkRoleUpdatedAt: new Date("2026-08-20T12:00:00.000Z") },
    });
  });

  it("keeps conflict errors typed and sanitized", () => {
    const error = new IdentityConflictError("SECOND_MEMBERSHIP");
    expect(error.message).toBe("Identity conflict");
    expect(error.code).toBe("SECOND_MEMBERSHIP");
  });
});
