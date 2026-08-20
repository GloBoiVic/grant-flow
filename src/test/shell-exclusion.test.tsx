// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveAuthorizationMock, redirectMock } = vi.hoisted(() => ({
  resolveAuthorizationMock: vi.fn(),
  redirectMock: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/clerk/authorization", () => ({
  resolveAuthorization: resolveAuthorizationMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/components/auth/projection-pending-retry", () => ({
  default: () => <button type="button" data-testid="retry">Check again</button>,
}));
vi.mock("@/components/auth/organization-onboarding-form", () => ({
  default: () => <form data-testid="organization-onboarding" />,
}));

// Stub Clerk account/organization controls so the page can render without a
// Clerk provider; we only assert the page itself never composes shell chrome.
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

import AccessPage from "@/app/(authenticated)/access/page";
import OrganizationPage from "@/app/(authenticated)/organization/page";

const SHELL_CHROME_QUERIES = [
  () => screen.queryByRole("complementary", { name: "Application sidebar" }),
  () => screen.queryByRole("button", { name: "Open navigation" }),
  () => screen.queryByRole("button", { name: /Open account menu/ }),
  () => screen.queryByRole("navigation", { name: "Primary navigation" }),
] as const;

describe("shell exclusion from /access and /organization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the access page without any shell chrome", async () => {
    resolveAuthorizationMock.mockResolvedValue({ status: "projection-pending" });
    render(await AccessPage());

    expect(screen.getByRole("heading", { name: "Getting things ready" })).toBeInTheDocument();
    for (const query of SHELL_CHROME_QUERIES) {
      expect(query()).not.toBeInTheDocument();
    }
  });

  it("renders constrained onboarding without any shell chrome", async () => {
    resolveAuthorizationMock.mockResolvedValue({ status: "onboarding-eligible" });
    render(await OrganizationPage());

    expect(screen.getByRole("heading", { name: "Choose an organization" })).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
    for (const query of SHELL_CHROME_QUERIES) {
      expect(query()).not.toBeInTheDocument();
    }
  });
});
