import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(), parse: vi.fn(), process: vi.fn(),
}));
vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook: mocks.verify }));
vi.mock("@/lib/clerk/webhook", () => ({ parseClerkWebhook: mocks.parse, processClerkWebhook: mocks.process }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { POST } from "@/app/api/webhooks/clerk/route";

const request = () => new Request("http://localhost/api/webhooks/clerk", { method: "POST", body: "{}" }) as never;

describe("Clerk webhook route boundary", () => {
  it("verifies before parsing or loading persistence", async () => {
    mocks.verify.mockRejectedValueOnce(new Error("bad signature"));
    await expect(POST(request())).resolves.toHaveProperty("status", 400);
    expect(mocks.parse).not.toHaveBeenCalled();
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it.each([
    ["unsupported", null, 200],
    ["malformed", new Error("Malformed webhook"), 400],
    ["missing parent", Object.assign(new Error(), { constructor: { name: "MissingMembershipParentError" } }), 503],
     ["transient", Object.assign(new Error("database unavailable"), { constructor: { name: "MembershipReconciliationUnavailableError" } }), 503],
  ])("returns the expected status for %s processing", async (_name, result, status) => {
    mocks.verify.mockResolvedValueOnce({});
    if (result instanceof Error) mocks.parse.mockImplementationOnce(() => { throw result; });
    else mocks.parse.mockReturnValueOnce(result);
    await expect(POST(request())).resolves.toHaveProperty("status", status);
  });

  it("returns 200 and safely repeats an idempotent event", async () => {
    mocks.verify.mockResolvedValue({ type: "user.created" });
    mocks.parse.mockReturnValue({ type: "user.created" });
    mocks.process.mockResolvedValue(undefined);
    await expect(POST(request())).resolves.toHaveProperty("status", 200);
    await expect(POST(request())).resolves.toHaveProperty("status", 200);
    expect(mocks.process).toHaveBeenCalledTimes(2);
  });

  it("maps processor retry exhaustion to a retryable 503", async () => {
    mocks.verify.mockResolvedValueOnce({ type: "organizationMembership.deleted" });
    mocks.parse.mockReturnValueOnce({ type: "organizationMembership.deleted" });
    mocks.process.mockRejectedValueOnce(Object.assign(new Error("serialization"), {
      constructor: { name: "MembershipReconciliationUnavailableError" },
    }));

    const response = await POST(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Webhook processing unavailable", retryable: true });
  });
});
