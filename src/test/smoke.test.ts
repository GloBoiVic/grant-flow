import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createOrganizationSchema } from "@/lib/validation/organization";

describe("test tooling", () => {
  it("runs assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @/ alias to project code", () => {
    expect(createOrganizationSchema.safeParse({ name: "Grant Makers" }).success).toBe(true);
  });
});
