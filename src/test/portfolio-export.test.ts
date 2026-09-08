import { describe, expect, it } from "vitest";

import { PORTFOLIO_EXPORT_HEADERS, serializePortfolioCsv, type PortfolioExportRow } from "@/lib/export/portfolio-csv";

const row: PortfolioExportRow = {
  grantTitle: "=Grant, \"quoted\"\nname",
  funderName: " +Funder",
  funderType: "Family Fund",
  funderWebsite: "@https://example.test",
  funderCountyServed: null,
  funderNotes: "Funder notes\r\nSecond line",
  status: "Internal Review",
  amountRequested: "100.00",
  amountAwarded: "0.00",
  currency: "CAD",
  deadline: "2026-09-30",
  decisionDate: null,
  awardTimeframe: "-90 days",
  designation: "=Housing",
  countyServed: "Local County",
  nextSteps: "@Submit budget",
  notes: "Line one\nLine two",
  tags: ["Housing", "A \"quoted\" tag"],
};

describe("portfolio CSV serializer", () => {
  it("emits the fixed quoted 18-column header in order", () => {
    const csv = serializePortfolioCsv([]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.slice(1)).toBe(PORTFOLIO_EXPORT_HEADERS.map((header) => `"${header}"`).join(","));
    expect(PORTFOLIO_EXPORT_HEADERS).toHaveLength(18);
  });

  it("serializes rows deterministically with exact values, null cells, JSON tags, and CRLF", () => {
    const first = serializePortfolioCsv([row]);
    const second = serializePortfolioCsv([row]);

    expect(first).toBe(second);
    expect(first).toContain("\"Tags\"\r\n\"'=Grant, \"\"quoted\"\"\nname\"");
    expect(first).toContain("\"' +Funder\"");
    expect(first).toContain("\"'@https://example.test\"");
    expect(first).toContain("\"'-90 days\"");
    expect(first).toContain("\"'@Submit budget\"");
    expect(first).toContain("\"\"");
    expect(first.split("\r\n", 2)).toHaveLength(2);
  });

  it("guards formula-looking text after leading whitespace and leaves generated values unchanged", () => {
    const csv = serializePortfolioCsv([{ ...row, grantTitle: "  -formula", funderName: "ordinary", tags: [] }]);

    expect(csv).toContain("\"'  -formula\"");
    expect(csv).toContain("\"[]\"");
    expect(csv).toContain("\"Internal Review\"");
    expect(csv).toContain("\"100.00\"");
    expect(csv).toContain("\"0.00\"");
    expect(csv).toContain("\"\"");
  });
});
