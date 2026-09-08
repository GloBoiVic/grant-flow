// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createFunderMock, editFunderMock, refreshMock } = vi.hoisted(() => ({
  createFunderMock: vi.fn(),
  editFunderMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/app/(authenticated)/(org-required)/grants/actions", () => ({ createFunder: createFunderMock, editFunder: editFunderMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

import { FunderPage } from "@/components/funders/funder-page";
import type { FunderDto } from "@/types/funder";

const funder: FunderDto = {
  id: "funder-1",
  name: "North Star Foundation",
  type: "FOUNDATION",
  website: "https://northstar.example",
  countyServed: "North County",
  notes: "Annual review in the fall.",
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
    expect(screen.getByText("Add your first funder to get started.")).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Add funder" });
    expect(trigger).not.toHaveAttribute("aria-controls");
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Add funder" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add funder" })).toBeInTheDocument();
    expect(document.getElementById("add-funder-form")).not.toBeInTheDocument();
    expect(document.querySelector("section#add-funder-form")).not.toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Add funder" });
    expect(dialog).toHaveClass("overflow-hidden");
    expect(dialog.querySelector(".overflow-y-auto")).toBeInTheDocument();
    expect(dialog.querySelector(".overflow-y-auto")).toHaveClass("overscroll-contain", "px-4");
    expect(within(dialog).getByLabelText(/Name/)).toHaveAttribute("autocomplete", "organization");
    expect(screen.getByLabelText(/Website/)).toHaveAttribute("type", "url");
    expect(screen.getByLabelText(/Website/)).toHaveAttribute("placeholder", "example.org or https://example.org");
    expect(screen.getByLabelText(/County served/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
  });

  it("shows server validation errors while preserving entered values", async () => {
    createFunderMock.mockResolvedValue({ success: false, error: "Invalid funder details.", errors: { name: ["Name is required"] } });
    const user = userEvent.setup();
    render(<FunderPage funders={[]} />);
    await user.click(screen.getByRole("button", { name: "Add funder" }));
    const dialog = screen.getByRole("dialog", { name: "Add funder" });
    const name = within(dialog).getByLabelText(/Name/);
    await user.type(name, "Entered funder");
    await user.click(within(dialog).getByRole("button", { name: /^Add funder$/ }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Invalid funder details.");
    expect(name).toHaveValue("Entered funder");
    expect(within(dialog).getByText("Name is required")).toBeInTheDocument();
  });

  it("refreshes the organization-scoped list after a successful creation", async () => {
    createFunderMock.mockResolvedValue({ success: true, data: funder });
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Add funder" }));
    const dialog = screen.getByRole("dialog", { name: "Add funder" });
    await user.type(within(dialog).getByLabelText(/Name/), "North Star Foundation");
    await user.click(within(dialog).getByRole("button", { name: /^Add funder$/ }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent("Funder added successfully.");
    expect(createFunderMock).toHaveBeenCalledWith({ name: "North Star Foundation", type: "FOUNDATION", website: null, countyServed: null, notes: null });
  });

  it("selects a funder from its Name button while preserving an independent Website link", async () => {
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);

    expect(screen.queryByText("Organizations that support your grant portfolio.")).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Name", "Type", "Website"]);
    expect(screen.queryByText(/Showing \d+ funders?/)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Funder list" })).not.toHaveClass("shadow-sm");
    const row = screen.getByRole("row", { name: /North Star Foundation/ });
    expect(within(row).getByRole("link", { name: "https://northstar.example" })).toHaveAttribute("target", "_blank");
    const nameButton = screen.getByRole("button", { name: "Open details for North Star Foundation" });
    nameButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog", { name: "North Star Foundation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "North Star Foundation" })).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("Foundation")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).queryByText("Name", { exact: true })).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).queryByText("Funder record details and maintenance fields.")).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).queryByText("Update the funder record without leaving your portfolio.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://northstar.example" })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("North County")).toBeInTheDocument();
    expect(screen.getByText("Annual review in the fall.")).toHaveClass("whitespace-pre-wrap");
    expect(screen.getByRole("button", { name: "Edit funder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("overflow-hidden");
    expect(screen.getByRole("dialog").querySelector(".overflow-y-auto")).toHaveClass("overscroll-contain");
    expect(screen.queryByText(/Contacts|CRM|Activity timeline|Delete|Restore|Reminder|Owner/)).not.toBeInTheDocument();
  });

  it("uses concise empty values for a sparse funder and keeps long values wrapped", async () => {
    const sparseFunder = { ...funder, name: "A funder with a deliberately long name that should wrap safely", website: null, countyServed: null, notes: null };
    const user = userEvent.setup();
    render(<FunderPage funders={[sparseFunder]} />);

    const nameButton = screen.getByRole("button", { name: `Open details for ${sparseFunder.name}` });
    expect(nameButton).toHaveClass("break-words");
    await user.click(nameButton);

    const dialog = screen.getByRole("dialog");
    expect(screen.getByText("No notes yet")).toBeInTheDocument();
    expect(within(dialog).getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText("FOUNDATION")).not.toBeInTheDocument();
  });

  it("preserves edit values after a server validation error", async () => {
    editFunderMock.mockResolvedValue({ success: false, error: "Invalid funder details.", errors: { name: ["Name is required"] } });
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));

    const name = screen.getByLabelText(/Name/);
    await user.clear(name);
    await user.type(name, "Entered funder");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid funder details.");
    expect(name).toHaveValue("Entered funder");
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("updates the open detail from the complete result and refreshes the server-owned list", async () => {
    const updatedWebsite = "https://northstar.example/updated";
    const updatedNotes = "Updated notes\nSecond line";
    const updatedFunder: FunderDto = {
      ...funder,
      name: "North Star Community Fund",
      type: "CORPORATION",
      website: updatedWebsite,
      countyServed: null,
      notes: updatedNotes,
      updatedAt: "2026-08-22T00:00:00.000Z",
    };
    editFunderMock.mockResolvedValue({ success: true, data: updatedFunder });
    const user = userEvent.setup();
    const view = render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));
    await user.clear(screen.getByLabelText(/Name/));
    await user.type(screen.getByLabelText(/Name/), updatedFunder.name);
    await user.selectOptions(screen.getByLabelText(/Type/), updatedFunder.type);
    await user.clear(screen.getByLabelText(/Website/));
    await user.type(screen.getByLabelText(/Website/), updatedWebsite);
    await user.clear(screen.getByLabelText(/County served/));
    await user.clear(screen.getByLabelText(/Notes/));
    await user.type(screen.getByLabelText(/Notes/), updatedNotes);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(editFunderMock).toHaveBeenCalledOnce());
    expect(editFunderMock).toHaveBeenCalledWith({ funderId: "funder-1", name: updatedFunder.name, type: "CORPORATION", website: updatedWebsite, countyServed: null, notes: updatedNotes });
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading", { name: "Edit funder" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: updatedFunder.name })).toBeInTheDocument();
    expect(screen.getByText("Corporation")).toBeInTheDocument();
    expect(screen.getByText(/Updated notes/)).toHaveClass("whitespace-pre-wrap");
    expect(await screen.findByRole("status")).toHaveTextContent("Funder updated successfully.");

    await user.click(screen.getByRole("button", { name: "Close" }));
    view.rerender(<FunderPage funders={[updatedFunder]} />);
    expect(screen.getByRole("button", { name: `Open details for ${updatedFunder.name}` })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: updatedWebsite })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: `Open details for ${updatedFunder.name}` }));
    expect(screen.getByText(/Updated notes/)).toHaveClass("whitespace-pre-wrap");
  });

  it("submits scheme-less Websites through the custom validation path and displays the normalized result", async () => {
    const updatedFunder: FunderDto = { ...funder, website: "https://example.com" };
    editFunderMock.mockResolvedValue({ success: true, data: updatedFunder });
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));

    const website = screen.getByLabelText(/Website/);
    expect(website).toHaveAttribute("type", "url");
    expect(website.closest("form")).toHaveAttribute("novalidate");
    await user.clear(website);
    await user.type(website, "example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(editFunderMock).toHaveBeenCalledOnce());
    expect(editFunderMock).toHaveBeenCalledWith({ funderId: "funder-1", name: funder.name, type: funder.type, website: "example.com", countyServed: funder.countyServed, notes: funder.notes });
    expect(screen.getByRole("link", { name: "https://example.com" })).toHaveAttribute("href", "https://example.com");
  });

  it("protects dirty edits from the Sheet close control until discard is confirmed", async () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));
    await user.type(screen.getByLabelText(/Notes/), " Changed");

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(confirmMock).toHaveBeenCalledWith("Discard unsaved funder changes?");
    expect(screen.getByRole("heading", { name: "Edit funder" })).toBeInTheDocument();
    confirmMock.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    confirmMock.mockRestore();
  });

  it("protects dirty edits from overlay dismissal until discard is confirmed", async () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));
    await user.type(screen.getByLabelText(/Notes/), " Changed");

    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    expect(overlay).toBeInTheDocument();
    await user.click(overlay!);

    expect(confirmMock).toHaveBeenCalledWith("Discard unsaved funder changes?");
    expect(screen.getByRole("heading", { name: "Edit funder" })).toBeInTheDocument();
    confirmMock.mockReturnValue(true);
    await user.click(overlay!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    confirmMock.mockRestore();
  });

  it("protects dirty edits from Escape dismissal until discard is confirmed", async () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));
    await user.type(screen.getByLabelText(/Notes/), " Changed");

    await user.keyboard("{Escape}");

    expect(confirmMock).toHaveBeenCalledWith("Discard unsaved funder changes?");
    expect(screen.getByRole("heading", { name: "Edit funder" })).toBeInTheDocument();
    confirmMock.mockReturnValue(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    confirmMock.mockRestore();
  });

  it("closes edit mode without exposing relationship or CRM controls", async () => {
    const user = userEvent.setup();
    render(<FunderPage funders={[funder]} />);
    await user.click(screen.getByRole("button", { name: "Open details for North Star Foundation" }));
    await user.click(screen.getByRole("button", { name: "Edit funder" }));
    expect(screen.getByRole("heading", { name: "Edit funder" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "North Star Foundation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /contact|crm|relationship|activity|delete|restore|reminder|owner/i })).not.toBeInTheDocument();
  });
});
