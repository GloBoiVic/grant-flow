import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyWebhookMock, processWebhookMock } = vi.hoisted(() => ({ verifyWebhookMock: vi.fn(), processWebhookMock: vi.fn() }));
vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook: verifyWebhookMock }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/clerk/webhook", () => ({
  parseClerkWebhook: (value: unknown) => {
    if (!value || typeof value !== "object" || (value as { type?: unknown }).type !== "organization.updated") throw new Error("Malformed webhook");
    return value;
  },
  processClerkWebhook: processWebhookMock,
}));

import { POST } from "@/app/api/webhooks/clerk/route";

describe("Clerk webhook route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid signature", async () => {
    verifyWebhookMock.mockRejectedValue(new Error("bad signature"));
    const response = await POST(new Request("http://localhost/api/webhooks/clerk") as never);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid webhook signature" });
  });

  it("rejects a signed malformed payload", async () => {
    verifyWebhookMock.mockResolvedValue({ type: "not-supported" });
    const response = await POST(new Request("http://localhost/api/webhooks/clerk") as never);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Malformed webhook" });
  });

  it("returns 503 when persistence is unavailable", async () => {
    verifyWebhookMock.mockResolvedValue({ type: "organization.updated" });
    processWebhookMock.mockRejectedValue(new Error("database unavailable"));
    const response = await POST(new Request("http://localhost/api/webhooks/clerk") as never);
    expect(response.status).toBe(503);
  });

  it("applies a verified organization.updated event", async () => {
    const event = { type: "organization.updated", object: "event", data: { id: "org_1" } };
    verifyWebhookMock.mockResolvedValue(event);
    processWebhookMock.mockResolvedValue({ status: "applied" });
    const response = await POST(new Request("http://localhost/api/webhooks/clerk") as never);
    expect(response.status).toBe(200);
    expect(processWebhookMock).toHaveBeenCalledWith({}, event);
  });
});
