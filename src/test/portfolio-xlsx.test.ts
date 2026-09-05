import { readFileSync } from "node:fs";
import path from "node:path";

import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import {
  MAX_IMPORT_CANDIDATE_ROWS,
  MAX_IMPORT_FILE_BYTES,
  PortfolioImportError,
  parsePortfolioWorkbook,
} from "@/lib/import/portfolio-xlsx";

const headers = [
  "Funder",
  "Type",
  "Requested Year 2025",
  "2025 Pending Requests",
  "Requested Year 2024",
  "Awarded Year 2025",
  "Awarded Year 2024",
  "Current Status",
  "Next Steps",
  "Due Date",
  "Approve/Decline Date",
  "Award Timeframe",
  "Designation",
  "County Served",
  "Notes",
  "Unrecognized Source Column",
];

function workbookBytes(rows: unknown[][], options: { date1904?: boolean; secondMatchingSheet?: boolean } = {}): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Main Tracker - FOR BOARD");
  if (options.secondMatchingSheet) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers]), "Archive");
  }
  if (options.date1904) workbook.Workbook = { WBProps: { date1904: true } };
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("portfolio XLSX parser and mapper", () => {
  it("maps the fixed source contract, preserves non-selected amounts, and collapses exact duplicates", () => {
    const row = [
      "  North   Star Foundation ",
      " foundation ",
      125000,
      5000,
      100000,
      80000,
      70000,
      " approved   award ",
      "  Send agreement  ",
      "2025-02-03",
      null,
      2025,
      " Housing Stability ",
      "North County",
      "Source note",
      "kept visible",
    ];
    const preview = parsePortfolioWorkbook(workbookBytes([headers, row, row, [], ["2026 Opportunities:"]]), {
      fileName: "tracker.xlsx",
    });

    expect(preview.worksheet).toBe("Main Tracker - FOR BOARD");
    expect(preview.unsupportedHeaders).toEqual(["Unrecognized Source Column"]);
    expect(preview.counts).toEqual({ structural: 2, candidate: 2, valid: 1, invalid: 0, collapsed: 1 });
    expect(preview.rows[0]).toMatchObject({
      sourceRowNumber: 2,
      state: "valid",
      grant: {
        title: "North Star Foundation — Housing Stability",
        status: "Awarded",
        amountRequested: "125000",
        amountAwarded: "80000",
        deadline: "2025-02-03",
        awardTimeframe: "2025",
        nextSteps: "Send agreement",
        notes: "Source note\n\nImported spreadsheet values:\n- 2025 Pending Requests: 5000\n- Requested Year 2024: 100000\n- Awarded Year 2024: 70000",
      },
      amountSelection: { requestedSourceColumn: "Requested Year 2025", awardedSourceColumn: "Awarded Year 2025" },
      funderDecision: { kind: "create", funderId: null },
    });
    expect(preview.rows[1]).toMatchObject({ state: "collapsed_duplicate", collapsedIntoSourceRow: 2 });
    expect(preview.rows[0].grant?.title).not.toMatch(/row|batch|import/i);
  });

  it("reuses only active exact-name funders and surfaces type disagreements", () => {
    const preview = parsePortfolioWorkbook(workbookBytes([headers, ["North Star Foundation", "Other", null, null, null, null, null, "Submitted"]]), {
      existingFunders: [
        { id: "active", name: " north   star foundation ", type: "FOUNDATION" },
        { id: "deleted", name: "North Star Foundation", type: "OTHER", deletedAt: "2026-01-01" },
      ],
    });

    expect(preview.rows[0]).toMatchObject({
      state: "valid",
      funderDecision: {
        kind: "reuse",
        funderId: "active",
        warning: "Existing Funder type is FOUNDATION; the existing Funder remains authoritative.",
      },
    });
    expect(preview.rows[0].warnings).toHaveLength(1);
  });

  it("rejects formula-bearing fields and bare numeric years without evaluating or guessing", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ["Formula Funder", "Foundation", 2025, null, null, null, null, "Submitted", null, 2025]]);
    worksheet.A2 = { t: "s", v: "Formula Funder", f: '"Formula Funder"' };
    worksheet.C2 = { t: "n", v: 2025, f: "SUM(1, 2024)" };
    worksheet.J2 = { t: "n", v: 2025 };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker");
    const preview = parsePortfolioWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    expect(preview.rows[0].state).toBe("invalid");
    expect(preview.rows[0].errors).toEqual(expect.arrayContaining([
      'Formula values are not accepted in "Funder".',
      'Formula values are not accepted in "Requested Year 2025".',
      "Due Date: bare numeric years are not valid dates.",
    ]));
  });

  it("treats a formula-only Funder cell as an invalid candidate", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ["Formula Funder"]]);
    worksheet.A2 = { t: "s", v: "Formula Funder", f: '"Formula Funder"' };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker");

    const preview = parsePortfolioWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    expect(preview.counts).toEqual({ structural: 0, candidate: 1, valid: 0, invalid: 1, collapsed: 0 });
    expect(preview.rows[0]).toMatchObject({ sourceRowNumber: 2, state: "invalid" });
    expect(preview.rows[0].errors).toContain('Formula values are not accepted in "Funder".');
  });

  it("treats a formula-only Current Status cell as an invalid candidate", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, [null, null, null, null, null, null, null, "Formula Status"]]);
    worksheet.H2 = { t: "s", v: "Formula Status", f: '"Formula Status"' };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker");

    const preview = parsePortfolioWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    expect(preview.counts).toEqual({ structural: 0, candidate: 1, valid: 0, invalid: 1, collapsed: 0 });
    expect(preview.rows[0]).toMatchObject({ sourceRowNumber: 2, state: "invalid" });
    expect(preview.rows[0].errors).toContain('Formula values are not accepted in "Current Status".');
  });

  it("treats a literal Funder placeholder as an invalid candidate", () => {
    const preview = parsePortfolioWorkbook(workbookBytes([headers, ["-", "Foundation", null, null, null, null, null, "Submitted"]]));

    expect(preview.counts).toEqual({ structural: 0, candidate: 1, valid: 0, invalid: 1, collapsed: 0 });
    expect(preview.rows[0]).toMatchObject({ sourceRowNumber: 2, state: "invalid" });
    expect(preview.rows[0].errors).toContain("Funder is required.");
  });

  it("treats a literal Type placeholder as an invalid candidate", () => {
    const preview = parsePortfolioWorkbook(workbookBytes([headers, ["Placeholder Type", "-", null, null, null, null, null, "Submitted"]]));

    expect(preview.counts).toEqual({ structural: 0, candidate: 1, valid: 0, invalid: 1, collapsed: 0 });
    expect(preview.rows[0]).toMatchObject({ sourceRowNumber: 2, state: "invalid" });
    expect(preview.rows[0].errors).toContain("Type is required.");
  });

  it("treats a literal Current Status placeholder as an invalid candidate", () => {
    const preview = parsePortfolioWorkbook(workbookBytes([headers, ["Placeholder Status", "Foundation", null, null, null, null, null, "-"]]));

    expect(preview.counts).toEqual({ structural: 0, candidate: 1, valid: 0, invalid: 1, collapsed: 0 });
    expect(preview.rows[0]).toMatchObject({ sourceRowNumber: 2, state: "invalid" });
    expect(preview.rows[0].errors).toContain("Current Status is required.");
  });

  it("keeps optional placeholders null and structural rows skipped", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ["Optional Placeholder", "Foundation", null, null, null, null, null, "Submitted", "-", null, null, "-", "-", "-", "-"],
      [],
      [null, null, "Total"],
      ["2026 Opportunities:"],
    ]);
    worksheet.C4 = { t: "s", v: "Total", f: "SUM(C2:C3)" };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker");
    const preview = parsePortfolioWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    expect(preview.counts).toEqual({ structural: 3, candidate: 1, valid: 1, invalid: 0, collapsed: 0 });
    expect(preview.rows[0].grant).toMatchObject({
      title: "Optional Placeholder",
      nextSteps: null,
      awardTimeframe: null,
      designation: null,
      countyServed: null,
      notes: null,
    });
  });

  it("uses the workbook 1904 date system and allows unrelated worksheets", () => {
    const preview = parsePortfolioWorkbook(workbookBytes([headers, ["Funder", "Family Fund", null, null, null, null, null, "To Apply", null, 1]], { date1904: true }), {
      fileName: "tracker.XLSX",
    });

    expect(preview.rows[0].grant?.deadline).toBe("1904-01-02");
  });

  it("handles the checked-in reference workbook without exceeding the import bound", () => {
    const bytes = readFileSync(path.resolve(process.cwd(), "data/mock-grant-data.xlsx"));
    const preview = parsePortfolioWorkbook(bytes, { fileName: "mock-grant-data.xlsx" });

    expect(["Main Tracker", "Main Tracker - FOR BOARD"]).toContain(preview.worksheet);
    expect(preview.counts.candidate).toBeGreaterThan(0);
    expect(preview.counts.candidate).toBeLessThanOrEqual(MAX_IMPORT_CANDIDATE_ROWS);
  });

  it("rejects ambiguous sheets, unsupported file types, oversized files, and excessive candidates", () => {
    expect(() => parsePortfolioWorkbook(workbookBytes([headers], { secondMatchingSheet: true }))).toThrowError(PortfolioImportError);
    expect(() => parsePortfolioWorkbook(workbookBytes([headers]), { fileName: "tracker.xls" })).toThrowError(/Only \.xlsx/);
    expect(() => parsePortfolioWorkbook(new Uint8Array(MAX_IMPORT_FILE_BYTES + 1))).toThrowError(/5 MiB/);

    const rows = [headers, ...Array.from({ length: MAX_IMPORT_CANDIDATE_ROWS + 1 }, (_, index) => [`Funder ${index}`, "Other", null, null, null, null, null, "Submitted"])];
    expect(() => parsePortfolioWorkbook(workbookBytes(rows))).toThrowError(/1,000 candidate/);
  });

  it("counts formula-bearing candidates toward the candidate bound", () => {
    const rows = [
      headers,
      ...Array.from({ length: MAX_IMPORT_CANDIDATE_ROWS }, (_, index) => [`Funder ${index}`, "Other", null, null, null, null, null, "Submitted"]),
      ["Formula Funder"],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const formulaRowNumber = MAX_IMPORT_CANDIDATE_ROWS + 2;
    worksheet[`A${formulaRowNumber}`] = { t: "s", v: "Formula Funder", f: '"Formula Funder"' };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker");

    expect(() => parsePortfolioWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }))).toThrowError(/1,000 candidate/);
  });

  it("counts required placeholders toward and enforces the candidate bound", () => {
    const withinBound = [
      headers,
      ...Array.from({ length: MAX_IMPORT_CANDIDATE_ROWS - 1 }, (_, index) => [`Funder ${index}`, "Other", null, null, null, null, null, "Submitted"]),
      ["-", "Foundation", null, null, null, null, null, "Submitted"],
    ];
    const preview = parsePortfolioWorkbook(workbookBytes(withinBound));

    expect(preview.counts).toMatchObject({ structural: 0, candidate: MAX_IMPORT_CANDIDATE_ROWS, invalid: 1 });
    expect(preview.rows.at(-1)).toMatchObject({ sourceRowNumber: MAX_IMPORT_CANDIDATE_ROWS + 1, state: "invalid" });

    const overBound = [
      headers,
      ...Array.from({ length: MAX_IMPORT_CANDIDATE_ROWS }, (_, index) => [`Funder ${index}`, "Other", null, null, null, null, null, "Submitted"]),
      ["-", "Foundation", null, null, null, null, null, "Submitted"],
    ];
    expect(() => parsePortfolioWorkbook(workbookBytes(overBound))).toThrowError(/1,000 candidate/);
  });

  it("uses Grant Title when present and falls back to derived title for placeholders and blank", () => {
    const grantTitleHeaders = [...headers.filter((header) => header !== "Unrecognized Source Column"), "Grant Title"];
    const rowIndex = {
      funder: grantTitleHeaders.indexOf("Funder"),
      designation: grantTitleHeaders.indexOf("Designation"),
      grantTitle: grantTitleHeaders.indexOf("Grant Title"),
      status: grantTitleHeaders.indexOf("Current Status"),
      type: grantTitleHeaders.indexOf("Type"),
    };

    function rowWithGrantTitle(grantTitleValue: unknown): unknown[] {
      const row: unknown[] = Array(grantTitleHeaders.length).fill(null);
      row[rowIndex.funder] = "North Star Foundation";
      row[rowIndex.type] = "Foundation";
      row[rowIndex.status] = "Submitted";
      row[rowIndex.designation] = "Housing Stability";
      row[rowIndex.grantTitle] = grantTitleValue;
      return row;
    }

    const realTitlePreview = parsePortfolioWorkbook(workbookBytes([grantTitleHeaders, rowWithGrantTitle("Real Title")]));
    expect(realTitlePreview.recognizedHeaders).toContain("Grant Title");
    expect(realTitlePreview.unsupportedHeaders).not.toContain("Grant Title");
    expect(realTitlePreview.rows[0].grant?.title).toBe("Real Title");
    expect(realTitlePreview.rows[0].state).toBe("valid");

    const whitespaceTitlePreview = parsePortfolioWorkbook(workbookBytes([grantTitleHeaders, rowWithGrantTitle("  Real   Title  ")]));
    expect(whitespaceTitlePreview.rows[0].grant?.title).toBe("Real Title");

    const placeholders = ["-", "None", "none", "N/A", "n/a", "NA", "na", "Unknown", "UNKNOWN", "TBD", "tbd", "Not applicable", "NOT APPLICABLE", "not Applicable", "", null, "   "];
    for (const placeholder of placeholders) {
      const preview = parsePortfolioWorkbook(workbookBytes([grantTitleHeaders, rowWithGrantTitle(placeholder)]));
      expect(preview.rows[0].grant?.title).toBe("North Star Foundation — Housing Stability");
      expect(preview.rows[0].state).toBe("valid");
    }

    const noDesignationRow: unknown[] = Array(grantTitleHeaders.length).fill(null);
    noDesignationRow[rowIndex.funder] = "Lone Funder";
    noDesignationRow[rowIndex.type] = "Foundation";
    noDesignationRow[rowIndex.status] = "Submitted";
    noDesignationRow[rowIndex.grantTitle] = "None";
    const fallbackWithoutDesignation = parsePortfolioWorkbook(workbookBytes([grantTitleHeaders, noDesignationRow]));
    expect(fallbackWithoutDesignation.rows[0].grant?.title).toBe("Lone Funder");
  });

  it("recognizes Grant Title as a supported header without emitting unsupported warnings", () => {
    const grantTitleHeaders = [...headers.filter((header) => header !== "Unrecognized Source Column"), "Grant Title"];
    const row: unknown[] = Array(grantTitleHeaders.length).fill(null);
    row[grantTitleHeaders.indexOf("Funder")] = "Acme Foundation";
    row[grantTitleHeaders.indexOf("Type")] = "Foundation";
    row[grantTitleHeaders.indexOf("Current Status")] = "Submitted";
    row[grantTitleHeaders.indexOf("Grant Title")] = "Custom Grant Title";

    const preview = parsePortfolioWorkbook(workbookBytes([grantTitleHeaders, row]));
    expect(preview.recognizedHeaders).toContain("Grant Title");
    expect(preview.recognizedHeaders).toEqual(expect.arrayContaining(["Funder", "Type", "Current Status", "Grant Title"]));
    expect(preview.unsupportedHeaders).not.toContain("Grant Title");
    expect(preview.unsupportedHeaders).toEqual([]);
    expect(preview.rows[0].grant?.title).toBe("Custom Grant Title");
  });

  it("derives Funder — Designation title when Grant Title column is absent", () => {
    const withoutGrantTitle = headers.filter((header) => header !== "Grant Title" && header !== "Unrecognized Source Column");
    const row: unknown[] = Array(withoutGrantTitle.length).fill(null);
    row[withoutGrantTitle.indexOf("Funder")] = "North Star Foundation";
    row[withoutGrantTitle.indexOf("Type")] = "Foundation";
    row[withoutGrantTitle.indexOf("Current Status")] = "Submitted";
    row[withoutGrantTitle.indexOf("Designation")] = "Housing Stability";
    const preview = parsePortfolioWorkbook(workbookBytes([withoutGrantTitle, row]));
    expect(preview.recognizedHeaders).not.toContain("Grant Title");
    expect(preview.rows[0].grant?.title).toBe("North Star Foundation — Housing Stability");
  });

  it("uses Grant Name as primary title when present (Grant Title absent) and normalizes whitespace", () => {
    const grantNameHeaders = [...headers.filter((header) => header !== "Unrecognized Source Column"), "Grant Name"];
    const row: unknown[] = Array(grantNameHeaders.length).fill(null);
    row[grantNameHeaders.indexOf("Funder")] = "North Star Foundation";
    row[grantNameHeaders.indexOf("Type")] = "Foundation";
    row[grantNameHeaders.indexOf("Current Status")] = "Submitted";
    row[grantNameHeaders.indexOf("Designation")] = "Housing Stability";
    row[grantNameHeaders.indexOf("Grant Name")] = "Real Name";

    const preview = parsePortfolioWorkbook(workbookBytes([grantNameHeaders, row]));
    expect(preview.recognizedHeaders).toContain("Grant Name");
    expect(preview.unsupportedHeaders).not.toContain("Grant Name");
    expect(preview.unsupportedHeaders).toEqual([]);
    expect(preview.rows[0].grant?.title).toBe("Real Name");
    expect(preview.rows[0].state).toBe("valid");

    const whitespaceRow: unknown[] = Array(grantNameHeaders.length).fill(null);
    whitespaceRow[grantNameHeaders.indexOf("Funder")] = "North Star Foundation";
    whitespaceRow[grantNameHeaders.indexOf("Type")] = "Foundation";
    whitespaceRow[grantNameHeaders.indexOf("Current Status")] = "Submitted";
    whitespaceRow[grantNameHeaders.indexOf("Grant Name")] = "  Real   Name  ";
    const whitespacePreview = parsePortfolioWorkbook(workbookBytes([grantNameHeaders, whitespaceRow]));
    expect(whitespacePreview.rows[0].grant?.title).toBe("Real Name");
  });

  it("prefers Grant Name over Grant Title and falls back through placeholders to derived title", () => {
    const bothHeaders = [...headers.filter((header) => header !== "Unrecognized Source Column"), "Grant Name", "Grant Title"];
    const idx = {
      funder: bothHeaders.indexOf("Funder"),
      type: bothHeaders.indexOf("Type"),
      status: bothHeaders.indexOf("Current Status"),
      designation: bothHeaders.indexOf("Designation"),
      grantName: bothHeaders.indexOf("Grant Name"),
      grantTitle: bothHeaders.indexOf("Grant Title"),
    };

    function rowWithBoth(grantNameValue: unknown, grantTitleValue: unknown, designation: unknown = "Housing Stability"): unknown[] {
      const row: unknown[] = Array(bothHeaders.length).fill(null);
      row[idx.funder] = "North Star Foundation";
      row[idx.type] = "Foundation";
      row[idx.status] = "Submitted";
      row[idx.designation] = designation;
      row[idx.grantName] = grantNameValue;
      row[idx.grantTitle] = grantTitleValue;
      return row;
    }

    const bothPresent = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth("Name Wins", "Title Alias")]));
    expect(bothPresent.recognizedHeaders).toEqual(expect.arrayContaining(["Grant Name", "Grant Title"]));
    expect(bothPresent.unsupportedHeaders).not.toContain("Grant Name");
    expect(bothPresent.unsupportedHeaders).not.toContain("Grant Title");
    expect(bothPresent.rows[0].grant?.title).toBe("Name Wins");
    expect(bothPresent.rows[0].state).toBe("valid");

    const titleOnly = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth(null, "Fallback Title")]));
    expect(titleOnly.rows[0].grant?.title).toBe("Fallback Title");

    const namePlaceholderFallback = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth("None", "Fallback Title")]));
    expect(namePlaceholderFallback.rows[0].grant?.title).toBe("Fallback Title");

    const dashFallback = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth("-", "Fallback Title")]));
    expect(dashFallback.rows[0].grant?.title).toBe("Fallback Title");

    for (const placeholder of ["N/A", "n/a", "NA", "Unknown", "TBD", "Not applicable", "NOT APPLICABLE"]) {
      const preview = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth(placeholder, "Fallback Title")]));
      expect(preview.rows[0].grant?.title).toBe("Fallback Title");
    }

    const bothPlaceholders = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth("None", "-")]));
    expect(bothPlaceholders.rows[0].grant?.title).toBe("North Star Foundation — Housing Stability");

    const bothPlaceholdersNoDesignation = parsePortfolioWorkbook(workbookBytes([bothHeaders, rowWithBoth("N/A", "None", null)]));
    // funder only fallback when both are placeholders and no designation
    const noDesignationRow: unknown[] = Array(bothHeaders.length).fill(null);
    noDesignationRow[idx.funder] = "Lone Funder";
    noDesignationRow[idx.type] = "Foundation";
    noDesignationRow[idx.status] = "Submitted";
    noDesignationRow[idx.grantName] = "None";
    noDesignationRow[idx.grantTitle] = "N/A";
    const derivedFallback = parsePortfolioWorkbook(workbookBytes([bothHeaders, noDesignationRow]));
    expect(derivedFallback.rows[0].grant?.title).toBe("Lone Funder");
    expect(bothPlaceholdersNoDesignation.rows[0].grant?.title).toBe("North Star Foundation");
  });

  it("recognizes Grant Name as supported header and invalidates formula-bearing title cells", () => {
    const bothHeaders = [...headers.filter((header) => header !== "Unrecognized Source Column"), "Grant Name", "Grant Title"];

    const singleGrantNameRow: unknown[] = Array(bothHeaders.length).fill(null);
    singleGrantNameRow[bothHeaders.indexOf("Funder")] = "Acme Foundation";
    singleGrantNameRow[bothHeaders.indexOf("Type")] = "Foundation";
    singleGrantNameRow[bothHeaders.indexOf("Current Status")] = "Submitted";
    singleGrantNameRow[bothHeaders.indexOf("Grant Name")] = "Custom Grant Name";
    const preview = parsePortfolioWorkbook(workbookBytes([bothHeaders, singleGrantNameRow]));
    expect(preview.recognizedHeaders).toContain("Grant Name");
    expect(preview.recognizedHeaders).toContain("Grant Title");
    expect(preview.unsupportedHeaders).not.toContain("Grant Name");
    expect(preview.unsupportedHeaders).not.toContain("Grant Title");
    expect(preview.rows[0].grant?.title).toBe("Custom Grant Name");

    const bothPresentDiff: unknown[] = Array(bothHeaders.length).fill(null);
    bothPresentDiff[bothHeaders.indexOf("Funder")] = "Acme Foundation";
    bothPresentDiff[bothHeaders.indexOf("Type")] = "Foundation";
    bothPresentDiff[bothHeaders.indexOf("Current Status")] = "Submitted";
    bothPresentDiff[bothHeaders.indexOf("Grant Name")] = "Name Wins";
    bothPresentDiff[bothHeaders.indexOf("Grant Title")] = "Title Alias";
    const bothDiff = parsePortfolioWorkbook(workbookBytes([bothHeaders, bothPresentDiff]));
    expect(bothDiff.rows[0].grant?.title).toBe("Name Wins");

    const worksheet = XLSX.utils.aoa_to_sheet([bothHeaders, singleGrantNameRow]);
    worksheet[XLSX.utils.encode_cell({ r: 1, c: bothHeaders.indexOf("Grant Name") })] = { t: "s", v: "Custom Grant Name", f: '"Custom Grant Name"' };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker");
    const formulaPreview = parsePortfolioWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
    expect(formulaPreview.rows[0].state).toBe("invalid");
    expect(formulaPreview.rows[0].errors).toEqual(expect.arrayContaining(['Formula values are not accepted in "Grant Name".']));

    const grantTitleRow: unknown[] = Array(bothHeaders.length).fill(null);
    grantTitleRow[bothHeaders.indexOf("Funder")] = "Acme Foundation";
    grantTitleRow[bothHeaders.indexOf("Type")] = "Foundation";
    grantTitleRow[bothHeaders.indexOf("Current Status")] = "Submitted";
    grantTitleRow[bothHeaders.indexOf("Grant Title")] = "Title Value";
    const grantTitleSheet = XLSX.utils.aoa_to_sheet([bothHeaders, grantTitleRow]);
    grantTitleSheet[XLSX.utils.encode_cell({ r: 1, c: bothHeaders.indexOf("Grant Title") })] = { t: "s", v: "Title Value", f: '"Title Value"' };
    const grantTitleWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(grantTitleWorkbook, grantTitleSheet, "Tracker");
    const grantTitleFormulaPreview = parsePortfolioWorkbook(XLSX.write(grantTitleWorkbook, { type: "buffer", bookType: "xlsx" }));
    expect(grantTitleFormulaPreview.rows[0].state).toBe("invalid");
    expect(grantTitleFormulaPreview.rows[0].errors).toEqual(expect.arrayContaining(['Formula values are not accepted in "Grant Title".']));
  });

  it("filters generic Column<number> headers as empty and preserves legitimate unsupported headers", () => {
    const customHeaders = ["Funder", "Type", "Current Status", "Column1", "Column2", "COLUMN123", "column999", "Column16368", "Foo", "Bar"];
    const preview = parsePortfolioWorkbook(workbookBytes([customHeaders, ["Acme Foundation", "Foundation", "Submitted", null, null, null, null, null, null, null]]));

    expect(preview.recognizedHeaders).toEqual(["Funder", "Type", "Current Status"]);
    expect(preview.unsupportedHeaders).toEqual(["Foo", "Bar"]);
    expect(preview.unsupportedHeaders).not.toEqual(expect.arrayContaining(["Column1", "Column2", "COLUMN123", "column999", "Column16368"]));
    expect(preview.unsupportedSourceWarnings).toEqual(
      expect.arrayContaining(["Unsupported source headers were not interpreted: Foo, Bar."]),
    );
    expect(preview.counts).toMatchObject({ candidate: 1, valid: 1 });
  });

  it("treats a wide sheet with only generic columns as having no unsupported headers", () => {
    const wideHeaders = ["Funder", "Type", "Current Status", ...Array.from({ length: 30 }, (_, i) => `Column${i + 1}`)];
    const preview = parsePortfolioWorkbook(workbookBytes([wideHeaders, ["Wide Funder", "Foundation", "Submitted", ...Array(30).fill(null)]]));

    expect(preview.recognizedHeaders).toEqual(["Funder", "Type", "Current Status"]);
    expect(preview.unsupportedHeaders).toEqual([]);
    expect(preview.counts).toMatchObject({ candidate: 1, valid: 1 });
  });

  it("does not filter non-generic Column-like headers", () => {
    const edgeHeaders = ["Funder", "Type", "Current Status", "Column", "Column ", "ColumnX", "Column-1"];
    const preview = parsePortfolioWorkbook(workbookBytes([edgeHeaders, ["Edge Funder", "Foundation", "Submitted", null, null, null, null]]));

    expect(preview.unsupportedHeaders).toEqual(expect.arrayContaining(["Column", "ColumnX", "Column-1"]));
    expect(preview.unsupportedHeaders).not.toContain("Column1");
  });
});
