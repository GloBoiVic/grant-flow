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

import AccessPage from "@/app/(authenticated)/access/page";

describe("AccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["unauthenticated", "/login"],
    ["no-active-organization", "/organization"],
    ["authenticated", "/dashboard"],
  ] as const)("redirects the %s status to %s", async (status, path) => {
    resolveAuthorizationMock.mockResolvedValue({ status });
    await expect(AccessPage()).rejects.toThrow(`REDIRECT:${path}`);
    expect(redirectMock).toHaveBeenCalledWith(path);
  });

  it("renders projection-pending copy and the retry control without identity UI", async () => {
    resolveAuthorizationMock.mockResolvedValue({ status: "projection-pending" });
    render(await AccessPage());

    expect(screen.getByRole("heading", { name: "Getting things ready" })).toBeInTheDocument();
    expect(screen.getByTestId("retry")).toBeInTheDocument();
    // The page must not expose identity or organization data in any state.
    expect(screen.queryByText(/org_|user_|ADMIN|MEMBER|organization|role/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Access unavailable")).not.toBeInTheDocument();
    // The actual output must never include identity controls (user button/menu);
    // the retry control is the only button present.
    expect(screen.queryByRole("button", { name: /sign out|manage account|profile|user/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders role-mismatch as a fail-closed denial with no retry and no identity UI", async () => {
    resolveAuthorizationMock.mockResolvedValue({ status: "role-mismatch" });
    render(await AccessPage());

    expect(screen.getByRole("heading", { name: "Access unavailable" })).toBeInTheDocument();
    expect(
      screen.getByText("Your access could not be confirmed. Please try again later."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("retry")).not.toBeInTheDocument();
    expect(screen.queryByText(/org_|user_|ADMIN|MEMBER|organization|role/i)).not.toBeInTheDocument();
    // Denial must expose no controls at all — identity or otherwise.
    expect(screen.queryByRole("button", { name: /sign out|manage account|profile|user/i })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("propagates thrown resolver errors to the error boundary", async () => {
    const boom = new Error("database unavailable");
    resolveAuthorizationMock.mockRejectedValue(boom);
    await expect(AccessPage()).rejects.toBe(boom);
  });
});