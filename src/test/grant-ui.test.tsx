// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createGrantMock, editGrantMock, changeStatusMock, assignTagMock, createTagMock, removeTagMock, pushMock, replaceMock, pathnameMock } = vi.hoisted(() => ({ createGrantMock: vi.fn(), editGrantMock: vi.fn(), changeStatusMock: vi.fn(), assignTagMock: vi.fn(), createTagMock: vi.fn(), removeTagMock: vi.fn(), pushMock: vi.fn(), replaceMock: vi.fn(), pathnameMock: vi.fn(() => "/grants") }));
vi.mock("@/app/(authenticated)/(org-required)/grants/actions", () => ({ createGrant: createGrantMock, editGrant: editGrantMock, changeGrantStatus: changeStatusMock }));
vi.mock("@/app/(authenticated)/(org-required)/grants/tag-actions", () => ({ assignTagToGrant: assignTagMock, createTag: createTagMock, removeTagFromGrant: removeTagMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: vi.fn() }), usePathname: pathnameMock, useSearchParams: () => new URLSearchParams(window.location.search) }));
vi.mock("@/components/layout/account-menu", () => ({ AccountMenu: () => null }));
vi.mock("@/components/layout/mobile-navigation", () => ({ MobileNavigation: () => null }));

import { GrantDetailSheet } from "@/components/grants/grant-detail-sheet";
import { GrantsPage } from "@/components/grants/grants-page";
import { GrantForm } from "@/components/grants/grant-form";
import { TopNavigation } from "@/components/layout/top-navigation";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto } from "@/types/grant";
import type { TagDto } from "@/types/tag";

const funder: FunderDto = { id: "funder-1", name: "North Star Foundation", type: "FOUNDATION", website: null, createdAt: "2026-08-21T00:00:00.000Z", updatedAt: "2026-08-21T00:00:00.000Z" };
const grant: GrantDetailDto = { id: "grant-1", funderId: funder.id, title: "Housing Stability Pilot", status: "Research", currency: "USD", amountRequested: "120000", amountAwarded: null, deadline: "2026-04-18", decisionDate: null, awardTimeframe: null, designation: "Housing", countyServed: null, nextSteps: "Confirm eligibility", notes: null, ownerId: "user-1", createdById: "user-1", createdAt: "2026-08-21T00:00:00.000Z", updatedAt: "2026-08-21T00:00:00.000Z", funder, tags: [], activities: [{ id: "activity-1", action: "grant_created", description: "Created grant Housing Stability Pilot.", metadata: null, actorId: "user-1", createdAt: "2026-08-21T00:00:00.000Z" }] };
const tags: TagDto[] = [{ id: "tag-1", name: "Housing" }, { id: "tag-2", name: "Youth Services" }];

describe("grant UI states", () => {
  beforeEach(() => { vi.clearAllMocks(); window.confirm = vi.fn(() => false); });

  it("exposes activity and an explicit accessible status control", () => {
    render(<GrantDetailSheet grant={grant} funders={[funder]} tags={tags} open onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Housing Stability Pilot" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Change grant status" })).toHaveValue("Research");
    expect(screen.getByText("Created grant Housing Stability Pilot.")).toBeInTheDocument();
  });

  it("reports status action success", async () => {
    changeStatusMock.mockResolvedValue({ success: true, data: { ...grant, status: "Qualified" } });
    const user = userEvent.setup();
    render(<GrantDetailSheet grant={grant} funders={[funder]} tags={tags} open onClose={vi.fn()} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Change grant status" }), "Qualified");
    await user.click(screen.getByRole("button", { name: "Change status" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Status updated successfully.");
    expect(changeStatusMock).toHaveBeenCalledWith({ grantId: "grant-1", status: "Qualified" });
  });

  it("assigns an active tag from the keyboard-friendly picker", async () => {
    assignTagMock.mockResolvedValue({ success: true, data: [tags[0]] });
    const user = userEvent.setup();
    render(<GrantDetailSheet grant={grant} funders={[funder]} tags={tags} open onClose={vi.fn()} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Add existing tag" }), "tag-1");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    expect(assignTagMock).toHaveBeenCalledWith({ grantId: "grant-1", tagId: "tag-1" });
    expect(await screen.findByRole("status")).toHaveTextContent("Housing added.");
    expect(screen.getByText("Housing")).toBeInTheDocument();
  });

  it("creates and assigns a tag inline, and exposes removal by name", async () => {
    createTagMock.mockResolvedValue({ success: true, data: tags[0] });
    assignTagMock.mockResolvedValue({ success: true, data: [tags[0]] });
    removeTagMock.mockResolvedValue({ success: true, data: [] });
    const user = userEvent.setup();
    render(<GrantDetailSheet grant={grant} funders={[funder]} tags={tags} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Create a new tag"), "Housing");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Housing created and added.");
    expect(screen.getByRole("button", { name: "Remove Housing tag" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Remove Housing tag" }));
    expect(removeTagMock).toHaveBeenCalledWith({ grantId: "grant-1", tagId: "tag-1" });
  });

  it("keeps the list preview bounded while exposing the complete tag summary", () => {
    render(<GrantsPage grants={{ items: [{ ...grant, tags: [...tags, { id: "tag-3", name: "Rural Development" }], funder }], page: 1, hasNextPage: false, hasPreviousPage: false }} funders={[funder]} selectedGrant={null} tags={tags} createOpen={false} />);
    expect(screen.getByLabelText("Tags: Housing, Youth Services, Rural Development")).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  it("opens the detail Sheet from the whole row while preserving child controls and pagination", async () => {
    const user = userEvent.setup();
    render(<GrantsPage grants={{ items: [{ ...grant, funder }], page: 1, hasNextPage: true, hasPreviousPage: false }} funders={[funder]} selectedGrant={null} tags={tags} createOpen={false} listQuery="" />);
    const row = screen.getByRole("row", { name: "Open Housing Stability Pilot" });
    const expectedUrl = "/grants?grant=grant-1";

    await user.click(screen.getByText("North Star Foundation"));
    expect(pushMock).toHaveBeenCalledWith(expectedUrl);

    pushMock.mockClear();
    row.focus();
    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith(expectedUrl);

    pushMock.mockClear();
    await user.keyboard(" ");
    expect(pushMock).toHaveBeenCalledWith(expectedUrl);

    pushMock.mockClear();
    await user.click(screen.getByRole("button", { name: /Housing Stability Pilot/ }));
    expect(pushMock).toHaveBeenCalledOnce();
    expect(pushMock).toHaveBeenCalledWith(expectedUrl);

    pushMock.mockClear();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(pushMock).toHaveBeenCalledWith("/grants?page=2");
  });

  it("toggles the default deadline sort and omits default URL values", async () => {
    const user = userEvent.setup();
    const view = render(<GrantsPage grants={{ items: [{ ...grant, funder }], page: 1, hasNextPage: false, hasPreviousPage: false }} funders={[funder]} selectedGrant={null} tags={tags} createOpen={false} listQuery="" />);
    await user.click(screen.getByRole("button", { name: "Sort by Due, currently ascending" }));
    expect(pushMock).toHaveBeenCalledWith("/grants?dir=desc");
    pushMock.mockClear();
    view.rerender(<GrantsPage grants={{ items: [{ ...grant, funder }], page: 1, hasNextPage: false, hasPreviousPage: false }} funders={[funder]} selectedGrant={null} tags={tags} createOpen={false} listQuery="dir=desc" />);
    await user.click(screen.getByRole("button", { name: "Sort by Due, currently descending" }));
    expect(pushMock).toHaveBeenCalledWith("/grants");
  });

  it("reveals progressive status and tag filters and preserves multi-select URL state", async () => {
    const user = userEvent.setup();
    render(<GrantsPage grants={{ items: [], page: 1, hasNextPage: false, hasPreviousPage: false }} funders={[funder]} selectedGrant={null} tags={tags} createOpen={false} listQuery="status=Research&tag=tag-1" />);
    expect(screen.queryByRole("checkbox", { name: "Internal Review" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add filter" }));
    expect(screen.getByText("Internal Review")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Research" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Housing" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Awarded" }));
    expect(pushMock).toHaveBeenCalledWith("/grants?tag=tag-1&status=Research&status=Awarded");
  });

  it("shows the scoped search only in the grants top navigation and preserves sheet state", async () => {
    pathnameMock.mockReturnValue("/grants");
    window.history.replaceState({}, "", "/grants?grant=grant-1&create=1&page=2");
    const identity = { organizationName: "North Star", userName: "Mira", userEmail: "mira@example.com", userInitials: "MH", userAvatarUrl: null };
    const { rerender } = render(<TopNavigation identity={identity} sidebarCollapsed={false} />);
    expect(screen.getByRole("textbox", { name: "Search grants or funders" })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Search grants or funders" }), "Housing");
    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/grants?grant=grant-1&create=1&q=Housing");
    pathnameMock.mockReturnValue("/dashboard");
    rerender(<TopNavigation identity={identity} sidebarCollapsed={false} />);
    expect(screen.queryByRole("textbox", { name: "Search grants or funders" })).not.toBeInTheDocument();
  });

  it("preserves list URL state while opening and closing the grant Sheet", async () => {
    const user = userEvent.setup();
    render(<GrantsPage grants={{ items: [{ ...grant, funder }], page: 2, hasNextPage: true, hasPreviousPage: true }} funders={[funder]} selectedGrant={grant} tags={tags} createOpen={false} listQuery="q=Housing&status=Research&tag=tag-1&sort=funder&dir=desc&page=2" />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(replaceMock).toHaveBeenCalledWith("/grants?q=Housing&status=Research&tag=tag-1&sort=funder&dir=desc&page=2");
  });

  it("protects dirty create forms from dismissal and preserves server errors", async () => {
    createGrantMock.mockResolvedValue({ success: false, error: "Invalid grant details.", errors: { title: ["Title is required"] } });
    const user = userEvent.setup(); const onClose = vi.fn();
    render(<GrantForm open funders={[funder]} onClose={onClose} />);
    const title = screen.getByLabelText(/Title/); await user.type(title, "Entered grant");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(window.confirm).toHaveBeenCalledWith("Discard unsaved grant changes?"); expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Create grant" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid grant details."));
    expect(title).toHaveValue("Entered grant");
  });

  it("submits edits without the separately managed status field", async () => {
    editGrantMock.mockResolvedValue({ success: true, data: grant });
    const user = userEvent.setup();
    render(<GrantForm open funders={[funder]} grant={grant} onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), "Updated grant");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(editGrantMock).toHaveBeenCalledOnce());
    const payload = editGrantMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({ grantId: "grant-1", title: "Updated grant", funderId: "funder-1" });
    expect(payload).not.toHaveProperty("status");
    expect(await screen.findByRole("status")).toHaveTextContent("Grant updated successfully.");
  });
});
