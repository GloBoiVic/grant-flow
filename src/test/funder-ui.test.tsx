// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createFunderMock, refreshMock } = vi.hoisted(() => ({
  createFunderMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/app/(authenticated)/(org-required)/grants/actions", () => ({ createFunder: createFunderMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

import { FunderPage } from "@/components/funders/funder-page";
import type { FunderDto } from "@/types/funder";

const funder: FunderDto = {
  id: "funder-1",
  name: "North Star Foundation",
  type: "FOUNDATION",
  website: "https://northstar.example",
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
};

describe("funder prerequisite UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an accessible empty state and opens the creation form", async () => {
    const user = userEvent.setup();
    render(<FunderPage funders={[]} />);

    expect(screen.getByRole("heading", { name: "No funders yet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add funder" }));
    expect(screen.getByRole("heading", { name: "Add funder" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toHaveAttribute("autocomplete", "organization");
    expect(screen.getByLabelText(/Website/)).toHaveAttribute("type", "url");
  });

  it("shows server validation errors while preserving entered values", async () => {
    createFunderMock.mockResolvedValue({ success: false, error: "Invalid funder details.", errors: { name: ["Name is required"] } });
    const user = userEvent.setup();
    render(<FunderPage funders={[]} />);
    await user.click(screen.getByRole("button", { name: "Add funder" }));
    const name = screen.getByLabelText(/Name/);
    await user.type(name, "Entered funder");
    await user.click(screen.getAllByRole("button", { name: /^Add funder$/ })[1]);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid funder details.");
    expect(name).toHaveValue("Entered funder");
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("refreshes the organization-scoped list after a successful creation", async () => {
    createFunderMock.mockResolvedValue({ success: true, data: funder });
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Add funder" }));
    await user.type(screen.getByLabelText(/Name/), "North Star Foundation");
    await user.click(screen.getAllByRole("button", { name: /^Add funder$/ })[1]);

    await waitFor(() => expect(refreshMock).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent("Funder added successfully.");
    expect(createFunderMock).toHaveBeenCalledWith({ name: "North Star Foundation", type: "FOUNDATION", website: "" });
  });
});
