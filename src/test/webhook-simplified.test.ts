import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { parseClerkWebhook, processClerkWebhook, type IdentityWebhookDb } from "@/lib/clerk/webhook";

const user = { id: "user_1", first_name: "A", last_name: "User", image_url: null, primary_email_address_id: "email_1", email_addresses: [{ id: "email_1", email_address: "a@example.com" }] };
const event = (type: string, data: unknown) => ({ type, object: "event", data });

function db(): IdentityWebhookDb {
  const value = { user: { upsert: vi.fn() }, organization: { upsert: vi.fn() }, $transaction: vi.fn() };
  value.$transaction.mockImplementation((callback: (tx: typeof value) => Promise<void>) => callback(value));
  return value as unknown as IdentityWebhookDb;
}

describe("simplified Clerk projections", () => {
  it("accepts only the four projection events and ignores membership events", () => {
    expect(parseClerkWebhook(event("user.created", user))).toBeTruthy();
    expect(parseClerkWebhook(event("organizationMembership.created", {}))).toBeNull();
  });

  it("upserts user and organization projections idempotently", async () => {
    const value = db();
    await processClerkWebhook(value, event("user.created", user));
    await processClerkWebhook(value, event("user.updated", user));
    expect(value.user.upsert).toHaveBeenCalledTimes(2);
    expect(value.user.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { clerkUserId: "user_1" } }));
  });

  it("applies organization.updated to the organization projection", async () => {
    const value = db();
    await processClerkWebhook(value, event("organization.updated", { id: "org_1", name: "Updated Org", slug: "updated-org" }));
    expect(value.organization.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { clerkOrgId: "org_1" },
      update: { name: "Updated Org", slug: "updated-org" },
    }));
  });

  it("keeps organization webhooks projection-only", async () => {
    const value = db();
    await processClerkWebhook(value, event("organization.created", {
      id: "org_1",
      name: "Org",
      slug: "org",
      created_by: "user_1",
      private_metadata: { grantflowOnboardingClaimId: "claim_1", grantflowOnboardingUserId: "user_1" },
    }));
    expect(value.organization.upsert).toHaveBeenCalled();
    expect(value).not.toHaveProperty("onboardingClaim");
  });

  it("never creates local membership or authorization state", async () => {
    const value = db();
    await processClerkWebhook(value, event("organization.created", { id: "org_1", name: "Org", slug: "org" }));
    expect(Object.keys(value)).toEqual(["user", "organization", "$transaction"]);
  });
});
