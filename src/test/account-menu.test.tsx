// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useClerkMock } = vi.hoisted(() => ({
  useClerkMock: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({ useClerk: useClerkMock }));

import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
import { AccountMenu } from "@/components/layout/account-menu";

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

describe("AccountMenu", () => {
  beforeEach(() => {
    installDomPolyfills();
    useClerkMock.mockReturnValue({
      openUserProfile: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("displays the projected user name, email, and initials in the trigger", () => {
    render(<AccountMenu identity={identity} />);

    const trigger = screen.getByRole("button", { name: /Open account menu/ });
    expect(trigger).toHaveTextContent("Jane Q. Doe");
    expect(trigger).toHaveTextContent("jane@example.com");
    expect(trigger).toHaveTextContent("JD");
  });

  it("opens the account menu without organization profile or member-management controls", async () => {
    const user = userEvent.setup();
    render(<AccountMenu identity={identity} />);

    await user.click(screen.getByRole("button", { name: /Open account menu/ }));

    expect(await screen.findByText("Profile")).toBeInTheDocument();
    expect(screen.queryByText(/organization settings|members|manage organization/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /switch organization/i })).not.toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls openUserProfile when Profile is selected", async () => {
    const user = userEvent.setup();
    render(<AccountMenu identity={identity} />);
    await user.click(screen.getByRole("button", { name: /Open account menu/ }));

    await user.click(await screen.findByText("Profile"));
    expect(useClerkMock().openUserProfile).toHaveBeenCalledTimes(1);
  });

  it("signs out with the /login redirect and disables while pending", async () => {
    let resolveSignOut!: () => void;
    useClerkMock.mockReturnValue({
      openUserProfile: vi.fn(),
      signOut: vi.fn().mockImplementation(() => new Promise<void>((resolve) => { resolveSignOut = resolve; })),
    });

    const user = userEvent.setup();
    render(<AccountMenu identity={identity} />);
    await user.click(screen.getByRole("button", { name: /Open account menu/ }));

    await user.click(await screen.findByText("Sign out"));
    expect(useClerkMock().signOut).toHaveBeenCalledWith({ redirectUrl: "/login" });
    expect(screen.getByText("Signing out…")).toBeInTheDocument();

    const signOutItem = screen.getByRole("menuitem", { name: /Signing out/ });
    expect(signOutItem).toHaveAttribute("data-disabled");

    resolveSignOut();
    await waitFor(() => expect(useClerkMock().signOut).toHaveBeenCalledTimes(1));
  });

  it("surfaces a sign-out failure in-menu with role=status and re-enables", async () => {
    useClerkMock.mockReturnValue({
      openUserProfile: vi.fn(),
      signOut: vi.fn().mockRejectedValue(new Error("boom")),
    });

    const user = userEvent.setup();
    render(<AccountMenu identity={identity} />);
    await user.click(screen.getByRole("button", { name: /Open account menu/ }));
    await user.click(await screen.findByText("Sign out"));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Sign out failed. Please try again.");
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    expect(screen.queryByText("Signing out…")).not.toBeInTheDocument();
  });
});
