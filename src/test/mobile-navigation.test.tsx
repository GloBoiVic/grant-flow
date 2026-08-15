// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

import { MobileNavigation } from "@/components/layout/mobile-navigation";

type MediaChangeHandler = (event: { matches: boolean }) => void;
let mediaChangeHandler: MediaChangeHandler | undefined;

function installMediaQueryMock(): void {
  window.matchMedia = ((query: string) => {
    const mql = {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_type: string, cb: MediaChangeHandler) => {
        mediaChangeHandler = cb;
      },
      removeEventListener: () => {
        mediaChangeHandler = undefined;
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
    return mql as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

function fireDesktopCrossing(): void {
  act(() => {
    mediaChangeHandler?.({ matches: true });
  });
}

describe("MobileNavigation Sheet behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    mediaChangeHandler = undefined;
    installMediaQueryMock();
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
    usePathnameMock.mockReturnValue("/dashboard");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders only the mobile trigger, not a desktop sidebar", () => {
    render(<MobileNavigation organizationName="Grant Makers" />);
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Application sidebar" })).not.toBeInTheDocument();
  });

  it("opens a Sheet with an accessible title and the organization name", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation organizationName="Grant Makers" />);

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(await screen.findByRole("dialog", { name: /GrantFlow/ })).toBeInTheDocument();
    expect(screen.getByText("Grant Makers")).toBeInTheDocument();
  });

  it("renders all primary navigation links inside the Sheet", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation organizationName="Grant Makers" />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    for (const label of ["Dashboard", "Grants", "Funders", "Deadlines", "Import"]) {
      expect(await screen.findByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("closes the Sheet when a navigation link is selected", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation organizationName="Grant Makers" />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(await screen.findByRole("dialog", { name: /GrantFlow/ })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Grants" }));

    expect(screen.queryByRole("dialog", { name: /GrantFlow/ })).not.toBeInTheDocument();
  });

  it("closes the Sheet when crossing to the desktop breakpoint", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation organizationName="Grant Makers" />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(await screen.findByRole("dialog", { name: /GrantFlow/ })).toBeInTheDocument();

    fireDesktopCrossing();

    expect(screen.queryByRole("dialog", { name: /GrantFlow/ })).not.toBeInTheDocument();
  });

  it("never reads or writes the desktop-only collapse preference", async () => {
    window.localStorage.setItem("grantflow:sidebar-collapsed:v1", "false");
    const getItem = vi.spyOn(window.localStorage, "getItem");
    const setItem = vi.spyOn(window.localStorage, "setItem");

    const user = userEvent.setup();
    render(<MobileNavigation organizationName="Grant Makers" />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.click(screen.getByRole("link", { name: "Grants" }));

    expect(setItem).not.toHaveBeenCalledWith("grantflow:sidebar-collapsed:v1", expect.anything());
    expect(getItem).not.toHaveBeenCalledWith("grantflow:sidebar-collapsed:v1");
    expect(window.localStorage.getItem("grantflow:sidebar-collapsed:v1")).toBe("false");
  });
});
