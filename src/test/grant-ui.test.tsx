// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createGrantMock, editGrantMock, changeStatusMock, pushMock, replaceMock } = vi.hoisted(() => ({ createGrantMock: vi.fn(), editGrantMock: vi.fn(), changeStatusMock: vi.fn(), pushMock: vi.fn(), replaceMock: vi.fn() }));
vi.mock("@/app/(authenticated)/(org-required)/grants/actions", () => ({ createGrant: createGrantMock, editGrant: editGrantMock, changeGrantStatus: changeStatusMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: vi.fn() }) }));

import { GrantDetailSheet } from "@/components/grants/grant-detail-sheet";
import { GrantForm } from "@/components/grants/grant-form";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto } from "@/types/grant";

const funder: FunderDto = { id: "funder-1", name: "North Star Foundation", type: "FOUNDATION", website: null, createdAt: "2026-08-21T00:00:00.000Z", updatedAt: "2026-08-21T00:00:00.000Z" };
const grant: GrantDetailDto = { id: "grant-1", funderId: funder.id, title: "Housing Stability Pilot", status: "Research", currency: "USD", amountRequested: "120000", amountAwarded: null, deadline: "2026-04-18", decisionDate: null, awardTimeframe: null, designation: "Housing", countyServed: null, nextSteps: "Confirm eligibility", notes: null, ownerId: "user-1", createdById: "user-1", createdAt: "2026-08-21T00:00:00.000Z", updatedAt: "2026-08-21T00:00:00.000Z", funder, activities: [{ id: "activity-1", action: "grant_created", description: "Created grant Housing Stability Pilot.", metadata: null, actorId: "user-1", createdAt: "2026-08-21T00:00:00.000Z" }] };

describe("grant UI states", () => {
  beforeEach(() => { vi.clearAllMocks(); window.confirm = vi.fn(() => false); });

  it("exposes activity and an explicit accessible status control", () => {
    render(<GrantDetailSheet grant={grant} funders={[funder]} open onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Housing Stability Pilot" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Change grant status" })).toHaveValue("Research");
    expect(screen.getByText("Created grant Housing Stability Pilot.")).toBeInTheDocument();
  });

  it("reports status action success", async () => {
    changeStatusMock.mockResolvedValue({ success: true, data: { ...grant, status: "Qualified" } });
    const user = userEvent.setup();
    render(<GrantDetailSheet grant={grant} funders={[funder]} open onClose={vi.fn()} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Change grant status" }), "Qualified");
    await user.click(screen.getByRole("button", { name: "Change status" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Status updated successfully.");
    expect(changeStatusMock).toHaveBeenCalledWith({ grantId: "grant-1", status: "Qualified" });
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
