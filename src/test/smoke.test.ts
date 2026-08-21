import { describe, expect, it } from "vitest";

import { ClerkRole } from "@/lib/clerk/roles";

// Tooling smoke test (GF-AUTH-001, Task 1): proves Vitest runs, TypeScript
// transforms, and the `@/` path alias resolves against real project code.
// Not a feature test — auth unit tests will be added with their features.
describe("test tooling", () => {
  it("runs assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @/ alias to project code", () => {
    expect(ClerkRole).toMatchObject({
      ADMIN: "org:admin",
      MEMBER: "org:member",
    });
  });
});
