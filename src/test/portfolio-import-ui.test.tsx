// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyzeMock, confirmMock } = vi.hoisted(() => ({
  analyzeMock: vi.fn(),
  confirmMock: vi.fn(),
}));

vi.mock("@/app/(authenticated)/(org-required)/import/actions", () => ({
  analyzePortfolioImport: analyzeMock,
  confirmPortfolioImport: confirmMock,
}));

import ImportPage from "@/app/(authenticated)/(org-required)/import/page";
import { PortfolioImportPage } from "@/components/import/portfolio-import-page";
import type { PortfolioImportPreview } from "@/lib/import/portfolio-xlsx";

const ACKNOWLEDGEMENT_TEXT = "I reviewed the valid rows and understand that this import will create new GrantFlow grant records.";

const preview: PortfolioImportPreview = {
  fileName: "board-tracker.xlsx",
  worksheet: "Main Tracker - FOR BOARD",
  headerRowNumber: 3,
  recognizedHeaders: ["Funder", "Type", "Current Status", "Designation"],
  unsupportedHeaders: ["Internal owner"],
  unsupportedSourceWarnings: ["Internal owner is disclosed but is not imported."],
  statusMapping: { Submitted: "Submitted", "To Apply": "Research" },
  requestedAmountOrder: ["Requested Year 2025", "2025 Pending Requests", "Requested Year 2024"],
  awardedAmountOrder: ["Awarded Year 2025", "Awarded Year 2024"],
  counts: { structural: 2, candidate: 3, valid: 1, invalid: 1, collapsed: 1 },
  rows: [
    {
      sourceRowNumber: 4,
      state: "valid",
      grant: {
        title: "North Star Foundation — Housing",
        status: "Submitted",
        currency: "USD",
        amountRequested: "120000",
        amountAwarded: null,
        deadline: "2026-04-18",
        decisionDate: null,
        awardTimeframe: "2026",
        designation: "Housing",
        countyServed: "King",
        nextSteps: "Confirm eligibility",
        notes: "Imported spreadsheet values\nRequested Year 2024: 90000",
      },
      funder: { name: "North Star Foundation", normalizedName: "north star foundation", type: "FOUNDATION" },
      funderDecision: { kind: "create", funderId: null, name: "North Star Foundation", type: "FOUNDATION" },
      amountSelection: { requestedSourceColumn: "Requested Year 2025", awardedSourceColumn: null },
      preservedSourceValues: [{ sourceColumn: "Requested Year 2024", value: "90000" }],
      errors: [],
      warnings: [],
      collapsedIntoSourceRow: null,
      collapsedSourceRows: [],
    },
    {
      sourceRowNumber: 5,
      state: "invalid",
      grant: null,
      funder: { name: "North Star Foundation", normalizedName: "north star foundation", type: "FOUNDATION" },
      funderDecision: null,
      amountSelection: { requestedSourceColumn: null, awardedSourceColumn: null },
      preservedSourceValues: [],
      errors: ["Current Status is required."],
      warnings: [],
      collapsedIntoSourceRow: null,
      collapsedSourceRows: [],
    },
    {
      sourceRowNumber: 6,
      state: "collapsed_duplicate",
      grant: {
        title: "North Star Foundation — Housing",
        status: "Submitted",
        currency: "USD",
        amountRequested: "120000",
        amountAwarded: null,
        deadline: "2026-04-18",
        decisionDate: null,
        awardTimeframe: "2026",
        designation: "Housing",
        countyServed: "King",
        nextSteps: "Confirm eligibility",
        notes: "Imported spreadsheet values\nRequested Year 2024: 90000",
      },
      funder: { name: "North Star Foundation", normalizedName: "north star foundation", type: "FOUNDATION" },
      funderDecision: { kind: "create", funderId: null, name: "North Star Foundation", type: "FOUNDATION" },
      amountSelection: { requestedSourceColumn: "Requested Year 2025", awardedSourceColumn: null },
      preservedSourceValues: [{ sourceColumn: "Requested Year 2024", value: "90000" }],
      errors: [],
      warnings: [],
      collapsedIntoSourceRow: 4,
      collapsedSourceRows: [],
    },
  ],
};

const completion = {
  worksheet: preview.worksheet,
  importBatchId: "batch-1",
  counts: { createdFunders: 1, reusedFunders: 0, createdGrants: 1, collapsed: 1, excluded: 1, structural: 2 },
};

function selectedWorkbook(): File {
  return new File(["workbook bytes"], "board-tracker.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

describe("portfolio import UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces the route placeholder and does not analyze on file selection", async () => {
    const user = userEvent.setup();
    render(<ImportPage />);
    const input = screen.getByLabelText("Excel workbook");

    await user.upload(input, selectedWorkbook());

    expect(screen.getByText("board-tracker.xlsx")).toBeInTheDocument();
    expect(analyzeMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Analyze workbook" })).toBeEnabled();
  });

  it("shows the server preview, requires exact acknowledgement, and re-submits the file", async () => {
    analyzeMock.mockResolvedValue({ success: true, data: preview });
    confirmMock.mockResolvedValue({ success: true, data: completion });
    const user = userEvent.setup();
    render(<PortfolioImportPage />);
    await user.upload(screen.getByLabelText("Excel workbook"), selectedWorkbook());
    await user.click(screen.getByRole("button", { name: "Analyze workbook" }));

    expect(await screen.findByRole("heading", { name: "Review what GrantFlow recognized" })).toBeInTheDocument();
    expect(screen.getByText("Unsupported headers")).toBeInTheDocument();
    expect(screen.getByText("Internal owner is disclosed but is not imported.")).toBeInTheDocument();
    expect(screen.getByText("Source row 5")).toBeInTheDocument();
    expect(screen.getByText("Excluded because")).toBeInTheDocument();
    expect(screen.getByText("Collapsed duplicate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import 1 valid grants" })).toBeDisabled();

    const acknowledgement = screen.getByRole("checkbox", { name: ACKNOWLEDGEMENT_TEXT });
    await user.click(acknowledgement);
    expect(screen.getByRole("button", { name: "Import 1 valid grants" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Import 1 valid grants" }));

    await waitFor(() => expect(confirmMock).toHaveBeenCalledOnce());
    const confirmationData = confirmMock.mock.calls[0][0] as FormData;
    expect(confirmationData.get("file")).toBeInstanceOf(File);
    expect((confirmationData.get("file") as File).name).toBe("board-tracker.xlsx");
    expect(confirmationData.get("acknowledged")).toBe("true");
    expect(await screen.findByRole("heading", { name: "Your portfolio is ready" })).toBeInTheDocument();
    expect(screen.getByText("Funders created").parentElement).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: "View grants" })).toHaveAttribute("href", "/grants");
    expect(screen.getByRole("link", { name: "View funders" })).toHaveAttribute("href", "/funders");
    expect(screen.queryByRole("button", { name: "Import 1 valid grants" })).not.toBeInTheDocument();
  });

  it("keeps confirmation unavailable when every candidate row is invalid", async () => {
    const invalidPreview: PortfolioImportPreview = {
      ...preview,
      counts: { structural: 0, candidate: 1, valid: 0, invalid: 1, collapsed: 0 },
      rows: [preview.rows[1]],
    };
    analyzeMock.mockResolvedValue({ success: true, data: invalidPreview });
    const user = userEvent.setup();
    render(<PortfolioImportPage />);
    await user.upload(screen.getByLabelText("Excel workbook"), selectedWorkbook());
    await user.click(screen.getByRole("button", { name: "Analyze workbook" }));
    expect(await screen.findByText("No valid grants remain. Correct the workbook and analyze it again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import 0 valid grants" })).toBeDisabled();
    expect(confirmMock).not.toHaveBeenCalled();
  });
});
