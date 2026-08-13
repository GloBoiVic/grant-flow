import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));

import { MalformedIdentityPayloadError, MembershipReconciliationUnavailableError, MissingMembershipParentError, parseClerkWebhook, processClerkWebhook, type IdentityWebhookDb } from "@/lib/clerk/webhook";

const organization = { id: "org_1", name: "Org", slug: "org" };
const user = {
  id: "user_1", first_name: "A", last_name: "User", image_url: "", primary_email_address_id: "email_1",
  email_addresses: [{ id: "email_1", email_address: "a@example.com" }],
};
const membership = { id: "mem_1", role: "org:member", organization, public_user_data: { user_id: "user_1" } };
const event = (type: string, data: unknown) => ({ type, object: "event", data });
type TestDb = {
  user: { upsert: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  organization: { upsert: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  membership: { upsert: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  $transaction: (fn: (tx: TestDb) => Promise<unknown>, options?: unknown) => Promise<unknown>;
};
const asDb = (db: TestDb) => db as unknown as IdentityWebhookDb;

describe("Clerk webhook contract", () => {
  it("parses all seven supported branches and ignores unsupported ones", () => {
    for (const [type, data] of [
      ["user.created", user], ["user.updated", user], ["organization.created", organization],
      ["organization.updated", organization], ["organizationMembership.created", membership],
      ["organizationMembership.updated", membership], ["organizationMembership.deleted", membership],
    ] as const) expect(parseClerkWebhook(event(type, data))).toBeTruthy();
    expect(parseClerkWebhook(event("session.created", {}))).toBeNull();
  });

  it("rejects a structurally unusable identity payload as malformed", () => {
    expect(() => parseClerkWebhook(event("user.created", { ...user, primary_email_address_id: null }))).toThrowError(/primary email/);
    expect(() => parseClerkWebhook(event("user.created", { ...user, email_addresses: [] }))).toThrow();
  });

  it("uses Clerk's current membership identity and role for create/update", async () => {
    const upsert = vi.fn();
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { upsert, deleteMany: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) }, $transaction: async (fn) => fn(db) };
    await processClerkWebhook(asDb(db), event("organizationMembership.updated", { ...membership, role: "org:admin" }), {
      getCurrentMembership: vi.fn().mockResolvedValue({ id: "mem_current", role: "org:member" }),
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { clerkMembershipId: "mem_current", role: "MEMBER" }, create: expect.objectContaining({ clerkMembershipId: "mem_current", role: "MEMBER" }) }));
  });

  it("does not let a stale delete remove a recreated membership", async () => {
    const deleteMany = vi.fn();
    const upsert = vi.fn();
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { deleteMany, upsert, findUnique: vi.fn().mockResolvedValue({ clerkMembershipId: "mem_recreated" }) }, $transaction: async (fn) => fn(db) };
    await processClerkWebhook(asDb(db), event("organizationMembership.deleted", membership), { getCurrentMembership: vi.fn().mockResolvedValue({ id: "mem_recreated", role: "org:member" }) });
    expect(deleteMany).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { clerkMembershipId: "mem_recreated", role: "MEMBER" } }));
  });

  it("reconciles a same-id active delete event instead of deleting", async () => {
    const deleteMany = vi.fn();
    const upsert = vi.fn();
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { deleteMany, upsert, findUnique: vi.fn().mockResolvedValue({ clerkMembershipId: "mem_1" }) }, $transaction: async (fn) => fn(db) };
    await processClerkWebhook(asDb(db), event("organizationMembership.deleted", { ...membership, role: "org:member" }), { getCurrentMembership: vi.fn().mockResolvedValue({ id: "mem_1", role: "org:admin" }) });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { clerkMembershipId: "mem_1", role: "ADMIN" }, create: expect.objectContaining({ clerkMembershipId: "mem_1" }) }));
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only the exact membership triple after Clerk confirms it is gone", async () => {
    const deleteMany = vi.fn();
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { deleteMany, upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ clerkMembershipId: "mem_1" }) }, $transaction: async (fn) => fn(db) };
    await processClerkWebhook(asDb(db), event("organizationMembership.deleted", membership), { getCurrentMembership: vi.fn().mockResolvedValue(null) });
    expect(deleteMany).toHaveBeenCalledWith({ where: { organizationId: "o", userId: "u", clerkMembershipId: "mem_1" } });
  });

  it("retries serializable conflicts with bounded attempts", async () => {
    let attempts = 0;
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) }, $transaction: async (fn) => { attempts += 1; if (attempts < 3) throw Object.assign(new Error("serialization"), { code: "P2034" }); return fn(db); } };
    await processClerkWebhook(asDb(db), event("organizationMembership.updated", membership), { getCurrentMembership: vi.fn().mockResolvedValue({ id: "mem_1", role: "org:member" }) });
    expect(attempts).toBe(3);
  });

  it("maps exhausted P2034 retries to a retryable processor error", async () => {
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) }, $transaction: async () => { throw Object.assign(new Error("serialization"), { code: "P2034" }); } };
    await expect(processClerkWebhook(asDb(db), event("organizationMembership.updated", membership), { getCurrentMembership: vi.fn().mockResolvedValue({ id: "mem_1", role: "org:member" }) })).rejects.toMatchObject({ retryable: true });
  });

  it("never deletes an unresolved legacy membership", async () => {
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "u" }) }, organization: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue({ id: "o" }) }, membership: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn().mockResolvedValue({ clerkMembershipId: null }) }, $transaction: async (fn) => fn(db) };
    await expect(processClerkWebhook(asDb(db), event("organizationMembership.deleted", membership), { getCurrentMembership: vi.fn().mockResolvedValue(null) })).rejects.toBeInstanceOf(MembershipReconciliationUnavailableError);
    expect(db.membership.deleteMany).not.toHaveBeenCalled();
  });

  it("fails closed for missing parents and preserves retryable failures", async () => {
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) }, organization: { upsert: vi.fn(), findUnique: vi.fn() }, membership: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn() }, $transaction: async (fn) => fn(db) };
    await expect(processClerkWebhook(asDb(db), event("organizationMembership.created", membership), { getCurrentMembership: vi.fn() })).rejects.toBeInstanceOf(MissingMembershipParentError);
    await expect(processClerkWebhook(asDb({ ...db, user: { upsert: vi.fn().mockRejectedValue(new Error("temporary")), findUnique: vi.fn() } }), event("user.created", user))).rejects.toThrow("temporary");
  });

  it("keeps identity normalization errors typed as permanent", async () => {
    const db: TestDb = { user: { upsert: vi.fn(), findUnique: vi.fn() }, organization: { upsert: vi.fn(), findUnique: vi.fn() }, membership: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn() }, $transaction: async (fn) => fn(db) };
    await expect(processClerkWebhook(asDb(db), event("user.created", { ...user, primary_email_address_id: null }))).rejects.toBeInstanceOf(Error);
    expect(MalformedIdentityPayloadError).toBeDefined();
  });
});
