// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));
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

import { NavigationList } from "@/components/layout/navigation-list";

describe("NavigationList", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/dashboard");
  });

  it("renders a labeled primary-navigation landmark with all shell links", () => {
    render(<NavigationList />);

    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(nav).toBeInTheDocument();

    for (const label of ["Dashboard", "Grants", "Funders", "Deadlines", "Import"]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", `/${label.toLowerCase()}`);
    }
  });

  it("marks the exact-current root with aria-current=page", () => {
    render(<NavigationList />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    for (const label of ["Grants", "Funders", "Deadlines", "Import"]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute("aria-current");
    }
  });

  it("marks a future descendant route as current for its parent root", () => {
    usePathnameMock.mockReturnValue("/grants/new");
    render(<NavigationList />);

    expect(screen.getByRole("link", { name: "Grants" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("does not mark a different root as current", () => {
    usePathnameMock.mockReturnValue("/funders/123");
    render(<NavigationList />);

    expect(screen.getByRole("link", { name: "Funders" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Grants" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate when a link is selected", () => {
    const onNavigate = vi.fn();
    render(<NavigationList onNavigate={onNavigate} />);

    screen.getByRole("link", { name: "Grants" }).click();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("retains accessible names for collapsed links via aria-label and title", () => {
    render(<NavigationList collapsed />);

    for (const label of ["Dashboard", "Grants", "Funders", "Deadlines", "Import"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("aria-label", label);
      expect(link).toHaveAttribute("title", label);
    }
  });
});
