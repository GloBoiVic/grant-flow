// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock, useClerkMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  useClerkMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({ href, children, onClick, ...props }: { href: string; children?: React.ReactNode; onClick?: () => void }) =>
      React.createElement(
        "a",
        {
          href,
          onClick: (event: React.MouseEvent) => {
            event.preventDefault();
            onClick?.();
          },
          ...props,
        },
        children,
      ),
  };
});
vi.mock("@clerk/nextjs", () => ({
  useClerk: () => useClerkMock(),
}));

import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
import { AppShell } from "@/components/layout/app-shell";

const identity: ShellIdentityDto = {
  organizationName: "Grant Makers",
  userName: "Jane Q. Doe",
  userEmail: "jane@example.com",
  userAvatarUrl: null,
  userInitials: "JD",
};

function installDomPolyfills(): void {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
  if (!window.PointerEvent) {
    window.PointerEvent = window.MouseEvent as unknown as typeof PointerEvent;
  }
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
}

describe("AppShell composition", () => {
  beforeEach(() => {
    installDomPolyfills();
    usePathnameMock.mockReturnValue("/dashboard");
    useClerkMock.mockReturnValue({
      openOrganizationProfile: vi.fn(),
      openUserProfile: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders a skip link, sidebar, header, and main landmarks", () => {
    render(<AppShell identity={identity}>content</AppShell>);

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("complementary", { name: "Application sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("renders children and the projected organization identity", () => {
    render(<AppShell identity={identity}><span>workspace content</span></AppShell>);

    expect(screen.getByText("workspace content")).toBeInTheDocument();
    expect(screen.getAllByText("Grant Makers").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Open account menu/ })).toBeInTheDocument();
  });

  it("applies the expanded main margin by default", () => {
    const { container } = render(<AppShell identity={identity}>content</AppShell>);
    const main = container.querySelector("main");
    expect(main?.className).toContain("lg:ml-[var(--layout-sidebar-w)]");
  });

  it("applies the collapsed main margin once the persisted collapse propagates", async () => {
    // Default expanded; the sidebar reads localStorage and applies it via a
    // 0ms timeout, so wait for the shell state to catch up.
    window.localStorage.setItem("grantflow:sidebar-collapsed:v1", "true");
    const { container } = render(<AppShell identity={identity}>content</AppShell>);
    const main = container.querySelector("main");
    await waitFor(() => {
      expect(main?.className).toContain("lg:ml-[var(--layout-sidebar-w-collapsed)]");
    });
    window.localStorage.clear();
  });
});
