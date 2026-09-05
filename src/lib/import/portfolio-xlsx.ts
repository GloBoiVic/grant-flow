import "server-only";

import * as XLSX from "xlsx";

import { createFunderSchema, FunderType, type FunderType as FunderTypeValue } from "@/lib/validations/funder";
import { createGrantSchema, GrantStatus, type GrantStatus as GrantStatusValue } from "@/lib/validations/grant";

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_CANDIDATE_ROWS = 1_000;
export const IMPORT_FILE_EXTENSION = ".xlsx";

export const REQUIRED_IMPORT_HEADERS = ["Funder", "Type", "Current Status"] as const;
export const OPTIONAL_IMPORT_HEADERS = [
  "Requested Year 2025",
  "2025 Pending Requests",
  "Requested Year 2024",
  "Awarded Year 2025",
  "Awarded Year 2024",
  "Next Steps",
  "Due Date",
  "Approve/Decline Date",
  "Award Timeframe",
  "Designation",
  "County Served",
  "Notes",
  "Grant Name",
  "Grant Title",
] as const;
export const SUPPORTED_IMPORT_HEADERS = [...REQUIRED_IMPORT_HEADERS, ...OPTIONAL_IMPORT_HEADERS] as const;

const REQUESTED_AMOUNT_COLUMNS = ["Requested Year 2025", "2025 Pending Requests", "Requested Year 2024"] as const;
const AWARDED_AMOUNT_COLUMNS = ["Awarded Year 2025", "Awarded Year 2024"] as const;

const FUNDER_TYPE_MAPPING = {
  foundation: FunderType.FOUNDATION,
  "family fund": FunderType.FAMILY_FUND,
  corporation: FunderType.CORPORATION,
  other: FunderType.OTHER,
} as const satisfies Record<string, FunderTypeValue>;

const STATUS_MAPPING = {
  "approved award": GrantStatus.Awarded,
  "declined award": GrantStatus.Declined,
  "declined loi": GrantStatus.Declined,
  submitted: GrantStatus.Submitted,
  "to apply": GrantStatus.Research,
  "in progress": GrantStatus.Planning,
} as const satisfies Record<string, GrantStatusValue>;

const FUNDER_PLACEHOLDERS = new Set(["-", "n/a", "na", "none", "unknown", "tbd", "not applicable"]);
const MAX_DECIMAL_INTEGER = "9999999999";

type SpreadsheetValue = string | number | boolean | Date | null;

export type ImportRowState = "valid" | "invalid" | "collapsed_duplicate";

export interface ImportGrantData {
  title: string;
  status: GrantStatusValue;
  currency: "USD";
  amountRequested: string | null;
  amountAwarded: string | null;
  deadline: string | null;
  decisionDate: string | null;
  awardTimeframe: string | null;
  designation: string | null;
  countyServed: string | null;
  nextSteps: string | null;
  notes: string | null;
}

export interface ImportFunderDraft {
  name: string;
  normalizedName: string;
  type: FunderTypeValue;
}

export type ImportFunderDecision =
  | { kind: "create"; funderId: null; name: string; type: FunderTypeValue }
  | { kind: "reuse"; funderId: string; name: string; type: FunderTypeValue; warning: string | null }
  | { kind: "ambiguous"; funderId: null; name: string; type: FunderTypeValue };

export interface ExistingFunderForImport {
  id: string;
  name: string;
  type: FunderTypeValue;
  deletedAt?: Date | string | null;
}

export interface PreservedImportValue {
  sourceColumn: string;
  value: string;
}

export interface PortfolioImportPreviewRow {
  sourceRowNumber: number;
  state: ImportRowState;
  grant: ImportGrantData | null;
  funder: ImportFunderDraft | null;
  funderDecision: ImportFunderDecision | null;
  amountSelection: {
    requestedSourceColumn: string | null;
    awardedSourceColumn: string | null;
  };
  preservedSourceValues: PreservedImportValue[];
  errors: string[];
  warnings: string[];
  collapsedIntoSourceRow: number | null;
  collapsedSourceRows: number[];
}

export interface PortfolioImportPreview {
  fileName: string;
  worksheet: string;
  headerRowNumber: number;
  recognizedHeaders: string[];
  unsupportedHeaders: string[];
  unsupportedSourceWarnings: string[];
  statusMapping: Record<string, GrantStatusValue>;
  requestedAmountOrder: string[];
  awardedAmountOrder: string[];
  counts: {
    structural: number;
    candidate: number;
    valid: number;
    invalid: number;
    collapsed: number;
  };
  rows: PortfolioImportPreviewRow[];
}

export type PortfolioImportErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_WORKBOOK"
  | "NO_MATCHING_SHEET"
  | "MULTIPLE_MATCHING_SHEETS"
  | "INVALID_HEADERS"
  | "TOO_MANY_CANDIDATE_ROWS";

export class PortfolioImportError extends Error {
  constructor(public readonly code: PortfolioImportErrorCode, message: string) {
    super(message);
    this.name = "PortfolioImportError";
  }
}

interface SourceCell {
  value: SpreadsheetValue;
  formula: boolean;
}

interface HeaderContract {
  rowNumber: number;
  rowIndex: number;
  columns: Map<string, number>;
  recognizedHeaders: string[];
  unsupportedHeaders: string[];
  duplicates: string[];
  range: XLSX.Range;
}

interface MappedCandidate {
  sourceRowNumber: number;
  state: ImportRowState;
  grant: ImportGrantData | null;
  funder: ImportFunderDraft | null;
  funderDecision: ImportFunderDecision | null;
  amountSelection: {
    requestedSourceColumn: string | null;
    awardedSourceColumn: string | null;
  };
  preservedSourceValues: PreservedImportValue[];
  errors: string[];
  warnings: string[];
  collapsedIntoSourceRow: number | null;
  collapsedSourceRows: number[];
  fingerprint: string | null;
}

interface AmountValue {
  sourceColumn: string;
  value: string | null;
  displayValue: string | null;
  error: string | null;
}

export interface PortfolioImportParseOptions {
  fileName?: string;
  existingFunders?: readonly ExistingFunderForImport[];
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase("en-US");
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === "string" && (value.trim() === "" || value.trim() === "-");
}

function isLiteralPlaceholder(value: unknown): boolean {
  return typeof value === "string" && value.trim() === "-";
}

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return normalizeWhitespace(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

function cellValue(cell: XLSX.CellObject | undefined): SpreadsheetValue {
  const value = cell?.v;
  if (value === undefined || value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date) return value;
  return null;
}

function sourceCell(worksheet: XLSX.WorkSheet, rowIndex: number, columnIndex: number): SourceCell {
  const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })] as XLSX.CellObject | undefined;
  return { value: cellValue(cell), formula: typeof cell?.f === "string" && cell.f.length > 0 };
}

function sourceRow(worksheet: XLSX.WorkSheet, rowIndex: number, range: XLSX.Range, columns: Map<string, number>): Map<string, SourceCell> {
  const result = new Map<string, SourceCell>();
  for (const [header, columnIndex] of columns) {
    if (columnIndex <= range.e.c) result.set(header, sourceCell(worksheet, rowIndex, columnIndex));
  }
  return result;
}

function headerValue(worksheet: XLSX.WorkSheet, rowIndex: number, columnIndex: number): string | null {
  const value = cellValue(worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })] as XLSX.CellObject | undefined);
  return typeof value === "string" && normalizeWhitespace(value) !== "" ? normalizeWhitespace(value) : null;
}

function findHeaderContract(worksheet: XLSX.WorkSheet): HeaderContract | null {
  if (!worksheet["!ref"]) return null;
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const matches: HeaderContract[] = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const columns = new Map<string, number>();
    const recognizedHeaders: string[] = [];
    const unsupportedHeaders: string[] = [];
    const duplicates = new Set<string>();

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const header = headerValue(worksheet, rowIndex, columnIndex);
      if (!header) continue;
      if (/^Column\d+$/i.test(header)) continue;
      if ((SUPPORTED_IMPORT_HEADERS as readonly string[]).includes(header)) {
        if (columns.has(header)) duplicates.add(header);
        else {
          columns.set(header, columnIndex);
          recognizedHeaders.push(header);
        }
      } else {
        unsupportedHeaders.push(header);
      }
    }

    if (REQUIRED_IMPORT_HEADERS.every((header) => columns.has(header))) {
      matches.push({
        rowNumber: rowIndex + 1,
        rowIndex,
        columns,
        recognizedHeaders,
        unsupportedHeaders: [...new Set(unsupportedHeaders)],
        duplicates: [...duplicates],
        range,
      });
    }
  }

  if (matches.length > 1) {
    throw new PortfolioImportError("INVALID_HEADERS", "The workbook contains more than one import header row in a worksheet.");
  }
  return matches[0] ?? null;
}

function assertFileInput(input: ArrayBuffer | Uint8Array, fileName: string): void {
  if (!fileName.toLocaleLowerCase("en-US").endsWith(IMPORT_FILE_EXTENSION)) {
    throw new PortfolioImportError("INVALID_FILE_TYPE", "Only .xlsx workbooks are supported.");
  }
  if (input.byteLength > MAX_IMPORT_FILE_BYTES) {
    throw new PortfolioImportError("FILE_TOO_LARGE", "The workbook must be 5 MiB or smaller.");
  }
  if (input.byteLength === 0) {
    throw new PortfolioImportError("INVALID_WORKBOOK", "The workbook is empty or malformed.");
  }
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const isZip = bytes.length >= 4
    && bytes[0] === 0x50
    && bytes[1] === 0x4b
    && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
    && (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
  if (!isZip) throw new PortfolioImportError("INVALID_WORKBOOK", "The upload is not a valid .xlsx workbook.");
}

function readWorkbook(input: ArrayBuffer | Uint8Array): XLSX.WorkBook {
  try {
    return XLSX.read(input, {
      type: "array",
      cellDates: false,
      cellFormula: true,
      dense: false,
    });
  } catch {
    throw new PortfolioImportError("INVALID_WORKBOOK", "The workbook is empty or malformed.");
  }
}

function textValue(cell: SourceCell, label: string, errors: string[]): string | null {
  if (cell.formula) {
    errors.push(`Formula values are not accepted in "${label}".`);
    return null;
  }
  if (isBlank(cell.value)) return null;
  if (typeof cell.value === "string" || typeof cell.value === "number" || typeof cell.value === "boolean") {
    return String(cell.value).trim();
  }
  errors.push(`The value in "${label}" must be text.`);
  return null;
}

function optionalText(cell: SourceCell | undefined, label: string, errors: string[]): string | null {
  if (!cell) return null;
  const value = textValue(cell, label, errors);
  return value === null || value === "-" ? null : value;
}

function requiredFunderName(cell: SourceCell | undefined, errors: string[]): string | null {
  if (!cell || cell.formula) {
    if (cell?.formula) errors.push('Formula values are not accepted in "Funder".');
    else errors.push("Funder is required.");
    return null;
  }
  if (isBlank(cell.value) || typeof cell.value !== "string") {
    errors.push("Funder is required.");
    return null;
  }
  const value = normalizeWhitespace(cell.value);
  if (FUNDER_PLACEHOLDERS.has(value.toLocaleLowerCase("en-US"))) {
    errors.push("Funder is required.");
    return null;
  }
  return value;
}

function mappedFunderType(cell: SourceCell | undefined, errors: string[]): FunderTypeValue | null {
  if (!cell || cell.formula) {
    if (cell?.formula) errors.push('Formula values are not accepted in "Type".');
    else errors.push("Type is required.");
    return null;
  }
  if (isBlank(cell.value)) {
    errors.push("Type is required.");
    return null;
  }
  const value = typeof cell.value === "string" ? normalizeKey(cell.value) : "";
  const mapped = FUNDER_TYPE_MAPPING[value as keyof typeof FUNDER_TYPE_MAPPING];
  if (!mapped) errors.push(`Unknown Funder type "${displayValue(cell.value) ?? ""}".`);
  return mapped ?? null;
}

function mappedStatus(cell: SourceCell | undefined, errors: string[]): GrantStatusValue | null {
  if (!cell || cell.formula) {
    if (cell?.formula) errors.push('Formula values are not accepted in "Current Status".');
    else errors.push("Current Status is required.");
    return null;
  }
  if (isBlank(cell.value)) {
    errors.push("Current Status is required.");
    return null;
  }
  const value = typeof cell.value === "string" ? normalizeKey(cell.value) : "";
  const mapped = STATUS_MAPPING[value as keyof typeof STATUS_MAPPING];
  if (!mapped) errors.push(`Unknown Current Status "${displayValue(cell.value) ?? ""}".`);
  return mapped ?? null;
}

function expandExponential(value: string): string {
  const match = value.match(/^([+-]?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i);
  if (!match) return value;
  const sign = match[1] === "-" ? "-" : "";
  const digits = `${match[2]}${match[3] ?? ""}`;
  const decimalIndex = match[2].length + Number(match[4]);
  if (decimalIndex <= 0) return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`;
  if (decimalIndex >= digits.length) return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

function canonicalAmount(value: unknown): { value: string | null; error: string | null } {
  if (isBlank(value)) return { value: null, error: null };
  let text: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { value: null, error: "Amount must be a finite, nonnegative number." };
    text = String(value);
  } else if (typeof value === "string") {
    text = value.trim();
  } else {
    return { value: null, error: "Amount must be a finite, nonnegative number." };
  }

  text = expandExponential(text);
  if (!/^\d+(?:\.\d+)?$/.test(text)) return { value: null, error: "Amount must be a finite, nonnegative number with at most two decimals." };
  const [integerPart, fractionalPart = ""] = text.split(".");
  if (fractionalPart.length > 2) return { value: null, error: "Amount must have no more than two decimal places." };
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");
  if (normalizedInteger.length > MAX_DECIMAL_INTEGER.length || (normalizedInteger.length === MAX_DECIMAL_INTEGER.length && normalizedInteger > MAX_DECIMAL_INTEGER)) {
    return { value: null, error: "Amount exceeds the supported database range." };
  }
  const normalizedFraction = fractionalPart.replace(/0+$/, "");
  return { value: normalizedFraction ? `${normalizedInteger}.${normalizedFraction}` : normalizedInteger, error: null };
}

function amountValue(cell: SourceCell | undefined, sourceColumn: string, errors: string[]): AmountValue {
  if (!cell) return { sourceColumn, value: null, displayValue: null, error: null };
  if (cell.formula) {
    const error = `Formula values are not accepted in "${sourceColumn}".`;
    errors.push(error);
    return { sourceColumn, value: null, displayValue: displayValue(cell.value), error };
  }
  const parsed = canonicalAmount(cell.value);
  if (parsed.error) errors.push(`${sourceColumn}: ${parsed.error}`);
  return { sourceColumn, value: parsed.value, displayValue: parsed.value, error: parsed.error };
}

function validDateParts(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isoDate(year: number, month: number, day: number): string | null {
  return validDateParts(year, month, day) ? `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
}

function excelSerialDate(serial: number, date1904: boolean): string | null {
  if (!Number.isFinite(serial) || serial < 0 || serial > 2958465) return null;
  const wholeSerial = Math.floor(serial);
  if (!date1904 && wholeSerial === 60) return null;

  let date: Date;
  if (date1904) {
    date = new Date(Date.UTC(1904, 0, 1) + wholeSerial * 86_400_000);
  } else if (wholeSerial < 60) {
    date = new Date(Date.UTC(1899, 11, 31) + wholeSerial * 86_400_000);
  } else {
    date = new Date(Date.UTC(1899, 11, 30) + wholeSerial * 86_400_000);
  }
  return Number.isNaN(date.getTime()) ? null : isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function dateValue(cell: SourceCell | undefined, label: string, date1904: boolean, errors: string[]): string | null {
  if (!cell) return null;
  if (cell.formula) {
    errors.push(`Formula values are not accepted in "${label}".`);
    return null;
  }
  if (isBlank(cell.value)) return null;
  if (cell.value instanceof Date) {
    const value = cell.value;
    const parsed = isoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    if (!parsed) errors.push(`${label}: date is invalid.`);
    return parsed;
  }
  if (typeof cell.value === "number") {
    if (Number.isInteger(cell.value) && cell.value >= 1000 && cell.value <= 9999) {
      errors.push(`${label}: bare numeric years are not valid dates.`);
      return null;
    }
    const parsed = excelSerialDate(cell.value, date1904);
    if (!parsed) errors.push(`${label}: date is invalid.`);
    return parsed;
  }
  if (typeof cell.value === "string") {
    const value = cell.value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      errors.push(`${label}: use a valid Excel date or YYYY-MM-DD text.`);
      return null;
    }
    const [year, month, day] = value.split("-").map(Number);
    const parsed = isoDate(year, month, day);
    if (!parsed) errors.push(`${label}: date is invalid.`);
    return parsed;
  }
  errors.push(`${label}: date is invalid.`);
  return null;
}

function sourceValuesNote(sourceValues: PreservedImportValue[], sourceNotes: string | null): string | null {
  if (sourceValues.length === 0) return sourceNotes;
  const block = ["Imported spreadsheet values:", ...sourceValues.map(({ sourceColumn, value }) => `- ${sourceColumn}: ${value}`)].join("\n");
  return sourceNotes ? `${sourceNotes}\n\n${block}` : block;
}

function mapCandidateRow(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  sourceRowNumber: number,
  header: HeaderContract,
  date1904: boolean,
): MappedCandidate {
  const cells = sourceRow(worksheet, rowIndex, header.range, header.columns);
  const errors: string[] = [];
  const warnings: string[] = [];
  const funderName = requiredFunderName(cells.get("Funder"), errors);
  const funderType = mappedFunderType(cells.get("Type"), errors);
  const status = mappedStatus(cells.get("Current Status"), errors);

  const designation = optionalText(cells.get("Designation"), "Designation", errors);
  const nextSteps = optionalText(cells.get("Next Steps"), "Next Steps", errors);
  const countyServed = optionalText(cells.get("County Served"), "County Served", errors);
  const sourceNotes = optionalText(cells.get("Notes"), "Notes", errors);
  const awardTimeframe = optionalText(cells.get("Award Timeframe"), "Award Timeframe", errors);
  const deadline = dateValue(cells.get("Due Date"), "Due Date", date1904, errors);
  const decisionDate = dateValue(cells.get("Approve/Decline Date"), "Approve/Decline Date", date1904, errors);
  const rawGrantName = optionalText(cells.get("Grant Name"), "Grant Name", errors);
  const rawGrantTitle = optionalText(cells.get("Grant Title"), "Grant Title", errors);
  const grantName = rawGrantName && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantName)) ? normalizeWhitespace(rawGrantName) : null;
  const grantTitleAlias = rawGrantTitle && !FUNDER_PLACEHOLDERS.has(normalizeKey(rawGrantTitle)) ? normalizeWhitespace(rawGrantTitle) : null;
  const effectiveTitle = grantName ?? grantTitleAlias;

  const requested = REQUESTED_AMOUNT_COLUMNS.map((sourceColumn) => amountValue(cells.get(sourceColumn), sourceColumn, errors));
  const awarded = AWARDED_AMOUNT_COLUMNS.map((sourceColumn) => amountValue(cells.get(sourceColumn), sourceColumn, errors));
  const selectedRequested = requested.find((amount) => amount.value !== null) ?? null;
  const selectedAwarded = awarded.find((amount) => amount.value !== null) ?? null;
  const preservedSourceValues = [...requested, ...awarded]
    .filter((amount) => amount.value !== null && amount.sourceColumn !== selectedRequested?.sourceColumn && amount.sourceColumn !== selectedAwarded?.sourceColumn)
    .map((amount) => ({ sourceColumn: amount.sourceColumn, value: amount.value as string }));

  const funder = funderName && funderType ? { name: funderName, normalizedName: normalizeKey(funderName), type: funderType } : null;
  const title = effectiveTitle ?? (funderName ? (designation ? `${funderName} — ${designation}` : funderName) : null);
  const grant = title && status
    ? {
        title,
        status,
        currency: "USD" as const,
        amountRequested: selectedRequested?.value ?? null,
        amountAwarded: selectedAwarded?.value ?? null,
        deadline,
        decisionDate,
        awardTimeframe,
        designation,
        countyServed,
        nextSteps,
        notes: sourceValuesNote(preservedSourceValues, sourceNotes),
      }
    : null;

  if (funder) {
    const funderValidation = createFunderSchema.safeParse({ name: funder.name, type: funder.type });
    if (!funderValidation.success) errors.push(...funderValidation.error.issues.map((issue) => `Funder: ${issue.message}`));
  }
  if (grant) {
    const grantValidation = createGrantSchema.safeParse({
      funderId: "import-funder",
      title: grant.title,
      status: grant.status,
      amountRequested: grant.amountRequested,
      amountAwarded: grant.amountAwarded,
      deadline: grant.deadline,
      decisionDate: grant.decisionDate,
      awardTimeframe: grant.awardTimeframe,
      designation: grant.designation,
      countyServed: grant.countyServed,
      nextSteps: grant.nextSteps,
      notes: grant.notes,
    });
    if (!grantValidation.success) errors.push(...grantValidation.error.issues.map((issue) => `${String(issue.path[0] ?? "Grant")}: ${issue.message}`));
  }

  const state: ImportRowState = errors.length === 0 ? "valid" : "invalid";
  const decision: ImportFunderDecision | null = funder
    ? { kind: "create", funderId: null, name: funder.name, type: funder.type }
    : null;
  const fingerprint = state === "valid" && grant && funder
    ? JSON.stringify({ funder: funder.normalizedName, type: funder.type, grant, preservedSourceValues })
    : null;

  return {
    sourceRowNumber,
    state,
    grant,
    funder,
    funderDecision: decision,
    amountSelection: {
      requestedSourceColumn: selectedRequested?.sourceColumn ?? null,
      awardedSourceColumn: selectedAwarded?.sourceColumn ?? null,
    },
    preservedSourceValues,
    errors,
    warnings,
    collapsedIntoSourceRow: null,
    collapsedSourceRows: [],
    fingerprint,
  };
}

function activeExistingFunders(existingFunders: readonly ExistingFunderForImport[]): ExistingFunderForImport[] {
  return existingFunders.filter((funder) => funder.deletedAt === undefined || funder.deletedAt === null);
}

function resolveFunders(rows: MappedCandidate[], existingFunders: readonly ExistingFunderForImport[]): void {
  const activeFunders = activeExistingFunders(existingFunders);
  const existingByName = new Map<string, ExistingFunderForImport[]>();
  for (const funder of activeFunders) {
    const key = normalizeKey(funder.name);
    const matches = existingByName.get(key) ?? [];
    matches.push(funder);
    existingByName.set(key, matches);
  }

  const validRows = rows.filter((row) => row.state === "valid" && row.funder && row.grant);
  const rowsByName = new Map<string, MappedCandidate[]>();
  for (const row of validRows) {
    const key = row.funder!.normalizedName;
    const grouped = rowsByName.get(key) ?? [];
    grouped.push(row);
    rowsByName.set(key, grouped);
  }

  for (const [key, grouped] of rowsByName) {
    const existing = existingByName.get(key) ?? [];
    if (existing.length > 1) {
      for (const row of grouped) {
        row.state = "invalid";
        row.errors.push("Multiple active Funders with this normalized name make the match ambiguous.");
        row.funderDecision = { kind: "ambiguous", funderId: null, name: row.funder!.name, type: row.funder!.type };
        row.fingerprint = null;
      }
      continue;
    }

    const sourceTypes = new Set(grouped.map((row) => row.funder!.type));
    if (existing.length === 0 && sourceTypes.size > 1) {
      for (const row of grouped) {
        row.state = "invalid";
        row.errors.push("Conflicting Funder types for a new Funder group are not supported.");
        row.funderDecision = { kind: "create", funderId: null, name: row.funder!.name, type: row.funder!.type };
        row.fingerprint = null;
      }
      continue;
    }

    for (const row of grouped) {
      const sourceFunder = row.funder!;
      if (existing.length === 1) {
        const existingFunder = existing[0];
        const warning = existingFunder.type !== sourceFunder.type
          ? `Existing Funder type is ${existingFunder.type}; the existing Funder remains authoritative.`
          : null;
        row.funderDecision = { kind: "reuse", funderId: existingFunder.id, name: sourceFunder.name, type: sourceFunder.type, warning };
        if (warning) row.warnings.push(warning);
      } else {
        row.funderDecision = { kind: "create", funderId: null, name: sourceFunder.name, type: sourceFunder.type };
      }
      row.fingerprint = JSON.stringify({
        funder: sourceFunder.normalizedName,
        funderDecision: row.funderDecision,
        grant: row.grant,
        preservedSourceValues: row.preservedSourceValues,
      });
    }
  }

  const canonicalByFingerprint = new Map<string, MappedCandidate>();
  for (const row of rows) {
    if (row.state !== "valid" || !row.fingerprint) continue;
    const canonical = canonicalByFingerprint.get(row.fingerprint);
    if (!canonical) {
      canonicalByFingerprint.set(row.fingerprint, row);
      continue;
    }
    row.state = "collapsed_duplicate";
    row.collapsedIntoSourceRow = canonical.sourceRowNumber;
    canonical.collapsedSourceRows.push(row.sourceRowNumber);
  }
}

function isClearlyStructuralRow(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  range: XLSX.Range,
  recognizedCells: SourceCell[],
  hasRequiredPlaceholder: boolean,
): boolean {
  const values: string[] = [];
  let hasFormula = false;
  const hasRecognizedFormula = recognizedCells.some((cell) => cell.formula);
  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const cell = sourceCell(worksheet, rowIndex, columnIndex);
    if (cell.formula) hasFormula = true;
    const value = displayValue(cell.value);
    if (value && !isBlank(value)) values.push(value);
  }
  if (hasRequiredPlaceholder) return false;
  if (values.length === 0) return !hasFormula;
  if (values.length === 1 && values[0].endsWith(":")) return true;
  // A formula in a recognized field is candidate evidence unless the row is
  // independently identifiable as a total row below.
  if (hasRecognizedFormula && !values.some((value) => /\btotal(s)?\b/i.test(value))) return false;
  if (!recognizedCells.some((cell) => !isBlank(cell.value) || cell.formula)) return true;
  if (!recognizedCells.some((cell) => !isBlank(cell.value) && typeof cell.value === "string" && !/^total\b/i.test(cell.value.trim()))) {
    return hasFormula;
  }
  if (!values.some((value) => /\btotal(s)?\b/i.test(value)) && !(hasFormula && recognizedCells.every((cell) => isBlank(cell.value) || cell.formula))) return false;
  return true;
}

function candidateRows(
  worksheet: XLSX.WorkSheet,
  header: HeaderContract,
  date1904: boolean,
): { structural: number; candidates: Array<{ rowIndex: number; sourceRowNumber: number }>; date1904: boolean } {
  let structural = 0;
  const candidates: Array<{ rowIndex: number; sourceRowNumber: number }> = [];
  const recognizedColumns = [...header.columns.values()];
  for (let rowIndex = header.rowIndex + 1; rowIndex <= header.range.e.r; rowIndex += 1) {
    const cells = recognizedColumns.map((columnIndex) => sourceCell(worksheet, rowIndex, columnIndex));
    const hasRequiredPlaceholder = REQUIRED_IMPORT_HEADERS.some((requiredHeader) => {
      const columnIndex = header.columns.get(requiredHeader);
      return columnIndex !== undefined && isLiteralPlaceholder(sourceCell(worksheet, rowIndex, columnIndex).value);
    });
    const hasRecognizedValue = cells.some((cell) => !isBlank(cell.value) || cell.formula) || hasRequiredPlaceholder;
    const funderCell = sourceCell(worksheet, rowIndex, header.columns.get("Funder") as number);
    const hasFunderValue = !isBlank(funderCell.value) || funderCell.formula || isLiteralPlaceholder(funderCell.value);
    if (!hasRecognizedValue || isClearlyStructuralRow(worksheet, rowIndex, header.range, cells, hasRequiredPlaceholder)) {
      structural += 1;
      continue;
    }
    if (!hasFunderValue && cells.every((cell) => isBlank(cell.value) && !cell.formula) && !hasRequiredPlaceholder) {
      structural += 1;
      continue;
    }
    candidates.push({ rowIndex, sourceRowNumber: rowIndex + 1 });
    if (candidates.length > MAX_IMPORT_CANDIDATE_ROWS) {
      throw new PortfolioImportError("TOO_MANY_CANDIDATE_ROWS", "The worksheet contains more than 1,000 candidate rows.");
    }
  }

  return { structural, candidates, date1904 };
}

function toPublicRow(row: MappedCandidate): PortfolioImportPreviewRow {
  return {
    sourceRowNumber: row.sourceRowNumber,
    state: row.state,
    grant: row.grant,
    funder: row.funder,
    funderDecision: row.funderDecision,
    amountSelection: row.amountSelection,
    preservedSourceValues: row.preservedSourceValues,
    errors: row.errors,
    warnings: row.warnings,
    collapsedIntoSourceRow: row.collapsedIntoSourceRow,
    collapsedSourceRows: row.collapsedSourceRows,
  };
}

function matchingSheets(workbook: XLSX.WorkBook): Array<{ name: string; contract: HeaderContract }> {
  const matches: Array<{ name: string; contract: HeaderContract }> = [];
  for (const name of workbook.SheetNames) {
    const worksheet = workbook.Sheets[name];
    const contract = worksheet ? findHeaderContract(worksheet) : null;
    if (contract) matches.push({ name, contract });
  }
  return matches;
}

export function parsePortfolioWorkbook(
  input: ArrayBuffer | Uint8Array,
  options: PortfolioImportParseOptions = {},
): PortfolioImportPreview {
  const fileName = options.fileName ?? "workbook.xlsx";
  assertFileInput(input, fileName);
  const workbook = readWorkbook(input);
  const matches = matchingSheets(workbook);
  if (matches.length === 0) throw new PortfolioImportError("NO_MATCHING_SHEET", "No worksheet contains the required Funder, Type, and Current Status headers.");
  if (matches.length > 1) throw new PortfolioImportError("MULTIPLE_MATCHING_SHEETS", "More than one worksheet contains the required import headers.");

  const selected = matches[0];
  if (selected.contract.duplicates.length > 0) {
    throw new PortfolioImportError("INVALID_HEADERS", `The worksheet contains duplicate supported headers: ${selected.contract.duplicates.join(", ")}.`);
  }
  const worksheet = workbook.Sheets[selected.name];
  const scanned = candidateRows(worksheet, selected.contract, Boolean(workbook.Workbook?.WBProps?.date1904));
  const mappedRows = scanned.candidates.map(({ rowIndex, sourceRowNumber }) => mapCandidateRow(worksheet, rowIndex, sourceRowNumber, selected.contract, scanned.date1904));
  resolveFunders(mappedRows, options.existingFunders ?? []);

  const rows = mappedRows.map(toPublicRow);
  const counts = {
    structural: scanned.structural,
    candidate: rows.length,
    valid: rows.filter((row) => row.state === "valid").length,
    invalid: rows.filter((row) => row.state === "invalid").length,
    collapsed: rows.filter((row) => row.state === "collapsed_duplicate").length,
  };
  const unsupportedSourceWarnings = selected.contract.unsupportedHeaders.length > 0
    ? [`Unsupported source headers were not interpreted: ${selected.contract.unsupportedHeaders.join(", ")}.`]
    : [];
  if (!selected.contract.columns.has("Designation")) unsupportedSourceWarnings.push("No source title column was recognized; Grant titles are derived from Funder and Designation.");
  if (!selected.contract.columns.has("Notes")) unsupportedSourceWarnings.push("No source Notes column was recognized; only mapped values will be imported.");

  return {
    fileName,
    worksheet: selected.name,
    headerRowNumber: selected.contract.rowNumber,
    recognizedHeaders: selected.contract.recognizedHeaders,
    unsupportedHeaders: selected.contract.unsupportedHeaders,
    unsupportedSourceWarnings,
    statusMapping: { ...STATUS_MAPPING },
    requestedAmountOrder: [...REQUESTED_AMOUNT_COLUMNS],
    awardedAmountOrder: [...AWARDED_AMOUNT_COLUMNS],
    counts,
    rows,
  };
}
