// @vitest-environment jsdom
import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
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

import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

const STORAGE_KEY = "grantflow:sidebar-collapsed:v1";

const advance = (): void => {
  act(() => {
    vi.advanceTimersByTime(0);
  });
};

describe("DesktopSidebar guarded persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    window.localStorage.clear();
    usePathnameMock.mockReturnValue("/dashboard");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the sidebar landmark, org name, and navigation", () => {
    render(<DesktopSidebar organizationName="Grant Makers" collapsed={false} onCollapsedChange={vi.fn()} />);

    expect(screen.getByRole("complementary", { name: "Application sidebar" })).toBeInTheDocument();
    expect(screen.getByText("Grant Makers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });

  it("applies the persisted collapsed literal 'true' after mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    const onCollapsedChange = vi.fn();
    render(<DesktopSidebar organizationName="Grant Makers" collapsed={false} onCollapsedChange={onCollapsedChange} />);

    expect(onCollapsedChange).not.toHaveBeenCalled();
    advance();
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it("applies the persisted expanded literal 'false' after mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "false");
    const onCollapsedChange = vi.fn();
    render(<DesktopSidebar organizationName="Grant Makers" collapsed={false} onCollapsedChange={onCollapsedChange} />);

    advance();
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  it("ignores non-literal stored values and keeps the default expanded state", () => {
    for (const invalid of ["1", "TRUE", "yes", "0", "random"]) {
      window.localStorage.setItem(STORAGE_KEY, invalid);
      const onCollapsedChange = vi.fn();
      render(<DesktopSidebar organizationName="Grant Makers" collapsed={false} onCollapsedChange={onCollapsedChange} />);
      advance();
      expect(onCollapsedChange).not.toHaveBeenCalled();
    }
  });

  it("ignores an absent stored value", () => {
    const onCollapsedChange = vi.fn();
    render(<DesktopSidebar organizationName="Grant Makers" collapsed={false} onCollapsedChange={onCollapsedChange} />);
    advance();
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it("writes only literal 'true'/'false' and notifies the shell on toggle", () => {
    const { rerender } = render(
      <DesktopSidebar organizationName="Grant Makers" collapsed={false} onCollapsedChange={() => {}} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    rerender(
      <DesktopSidebar organizationName="Grant Makers" collapsed onCollapsedChange={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("retains accessible names for navigation and the toggle when collapsed", () => {
    render(<DesktopSidebar organizationName="Grant Makers" collapsed onCollapsedChange={vi.fn()} />);

    for (const label of ["Dashboard", "Grants", "Funders", "Deadlines", "Import"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("aria-label", label);
      expect(link).toHaveAttribute("title", label);
    }
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(screen.getByText("Grant Makers")).toBeInTheDocument();
  });
});
