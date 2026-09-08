export interface PortfolioExportRow {
  grantTitle: string;
  funderName: string;
  funderType: string;
  funderWebsite: string | null;
  funderCountyServed: string | null;
  funderNotes: string | null;
  status: string;
  amountRequested: string | null;
  amountAwarded: string | null;
  currency: string;
  deadline: string | null;
  decisionDate: string | null;
  awardTimeframe: string | null;
  designation: string | null;
  countyServed: string | null;
  nextSteps: string | null;
  notes: string | null;
  tags: string[];
}

export const PORTFOLIO_EXPORT_HEADERS = [
  "Grant title",
  "Funder name",
  "Funder type",
  "Funder website",
  "Funder county served",
  "Funder notes",
  "Status",
  "Amount requested",
  "Amount awarded",
  "Currency",
  "Deadline",
  "Decision date",
  "Award timeframe",
  "Designation",
  "County served",
  "Next steps",
  "Notes",
  "Tags",
] as const;

function guardFormula(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function quoteCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function nullableCell(value: string | null, userControlled = false): string {
  const text = value ?? "";
  return quoteCell(userControlled ? guardFormula(text) : text);
}

export function serializePortfolioCsv(rows: readonly PortfolioExportRow[]): string {
  const records = [
    PORTFOLIO_EXPORT_HEADERS.map((header) => quoteCell(header)).join(","),
    ...rows.map((row) => [
      nullableCell(row.grantTitle, true),
      nullableCell(row.funderName, true),
      nullableCell(row.funderType),
      nullableCell(row.funderWebsite, true),
      nullableCell(row.funderCountyServed, true),
      nullableCell(row.funderNotes, true),
      nullableCell(row.status),
      nullableCell(row.amountRequested),
      nullableCell(row.amountAwarded),
      nullableCell(row.currency),
      nullableCell(row.deadline),
      nullableCell(row.decisionDate),
      nullableCell(row.awardTimeframe, true),
      nullableCell(row.designation, true),
      nullableCell(row.countyServed, true),
      nullableCell(row.nextSteps, true),
      nullableCell(row.notes, true),
      nullableCell(guardFormula(JSON.stringify(row.tags))),
    ].join(",")),
  ];

  return `\uFEFF${records.join("\r\n")}`;
}
