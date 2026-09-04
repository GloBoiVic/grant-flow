// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveAuthorizationMock, redirectMock } = vi.hoisted(() => ({
  resolveAuthorizationMock: vi.fn(),
  redirectMock: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/clerk/authorization", () => ({ resolveAuthorization: resolveAuthorizationMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/components/auth/organization-onboarding-form", () => ({
  default: () => <form data-testid="organization-onboarding" />,
}));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => <div data-testid="user-button" /> }));

import OrganizationPage from "@/app/(authenticated)/organization/page";

const SHELL_CHROME_QUERIES = [
  () => screen.queryByRole("complementary", { name: "Application sidebar" }),
  () => screen.queryByRole("button", { name: "Open navigation" }),
  () => screen.queryByRole("button", { name: /Open account menu/ }),
  () => screen.queryByRole("navigation", { name: "Primary navigation" }),
] as const;

describe("shell exclusion from organization onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders constrained onboarding without shell chrome", async () => {
    resolveAuthorizationMock.mockResolvedValue({ status: "missing-local-user" });
    render(await OrganizationPage());

    expect(screen.getByRole("heading", { name: "Create your organization" })).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
    expect(screen.getByTestId("organization-onboarding")).toBeInTheDocument();
    for (const query of SHELL_CHROME_QUERIES) expect(query()).not.toBeInTheDocument();
  });

  it("redirects an already-local user to the dashboard", async () => {
    resolveAuthorizationMock.mockResolvedValue({ status: "authenticated" });

    await expect(OrganizationPage()).rejects.toThrow("REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
