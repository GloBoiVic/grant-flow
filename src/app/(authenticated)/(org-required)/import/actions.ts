"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { authorizeAction } from "@/lib/clerk/authorization";
import {
  parsePortfolioWorkbook,
  PortfolioImportError,
  type ExistingFunderForImport,
  type PortfolioImportPreview,
  type PortfolioImportPreviewRow,
} from "@/lib/import/portfolio-xlsx";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/common";

const IMPORT_FILE_FIELD = "file";
const ACKNOWLEDGEMENT_FIELD = "acknowledged";

export interface PortfolioImportCommitCounts {
  createdFunders: number;
  reusedFunders: number;
  createdGrants: number;
  collapsed: number;
  excluded: number;
  structural: number;
}

export interface PortfolioImportCommitResult {
  worksheet: string;
  importBatchId: string;
  counts: PortfolioImportCommitCounts;
}

export type AnalyzePortfolioImportResult = ActionResult<PortfolioImportPreview>;
export type ConfirmPortfolioImportResult = ActionResult<PortfolioImportCommitResult>;

type DatabaseGrantStatus =
  | "Research"
  | "Qualified"
  | "Planning"
  | "Writing"
  | "InternalReview"
  | "Submitted"
  | "Pending"
  | "Awarded"
  | "Declined"
  | "Reporting"
  | "Closed";

function isImportUpload(value: FormDataEntryValue | null): value is File {
  return typeof value === "object"
    && value !== null
    && "arrayBuffer" in value
    && typeof value.arrayBuffer === "function";
}

function actionError<T>(error: unknown, fallback: string): ActionResult<T> {
  if (error instanceof PortfolioImportError) return { success: false, error: error.message };
  return { success: false, error: fallback };
}

function acknowledgementProvided(formData: FormData): boolean {
  const value = formData.get(ACKNOWLEDGEMENT_FIELD);
  return typeof value === "string" && new Set(["true", "on", "yes", "1"]).has(value.toLocaleLowerCase("en-US"));
}

async function readUpload(formData: FormData): Promise<{ bytes: Uint8Array; fileName: string }> {
  const entry = formData.get(IMPORT_FILE_FIELD);
  if (!isImportUpload(entry)) {
    throw new PortfolioImportError("INVALID_WORKBOOK", "Select an .xlsx workbook to import.");
  }

  try {
    const bytes = new Uint8Array(await entry.arrayBuffer());
    const fileName = typeof entry.name === "string" && entry.name.length > 0 ? entry.name : "workbook.xlsx";
    return { bytes, fileName };
  } catch {
    throw new PortfolioImportError("INVALID_WORKBOOK", "The workbook is empty or malformed.");
  }
}

async function activeFundersForOrganization(organizationId: string): Promise<ExistingFunderForImport[]> {
  return prisma.funder.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, name: true, type: true, deletedAt: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

function databaseStatus(status: string): DatabaseGrantStatus {
  return (status === "Internal Review" ? "InternalReview" : status) as DatabaseGrantStatus;
}

function databaseDate(value: string | null): Date | null {
  return value === null ? null : new Date(`${value}T00:00:00.000Z`);
}

function validRows(preview: PortfolioImportPreview): PortfolioImportPreviewRow[] {
  return preview.rows.filter((row) => row.state === "valid" && row.grant && row.funder && row.funderDecision);
}

function importMetadata(
  preview: PortfolioImportPreview,
  row: PortfolioImportPreviewRow,
  importBatchId: string,
): Prisma.InputJsonObject {
  return {
    source: "portfolio-import",
    worksheet: preview.worksheet,
    canonicalSourceRow: row.sourceRowNumber,
    ...(row.collapsedSourceRows.length > 0 ? { collapsedSourceRows: row.collapsedSourceRows } : {}),
    importBatchId,
  };
}

async function confirmInTransaction(
  bytes: Uint8Array,
  fileName: string,
  authorization: { organizationId: string; userId: string },
  importBatchId: string,
): Promise<PortfolioImportCommitResult | null> {
  return prisma.$transaction(async (tx) => {
    // This lookup deliberately happens in the confirmation transaction. The
    // analysis result and any funder IDs supplied by a client are display-only.
    const existingFunders = await tx.funder.findMany({
      where: { organizationId: authorization.organizationId, deletedAt: null },
      select: { id: true, name: true, type: true, deletedAt: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    const preview = parsePortfolioWorkbook(bytes, { fileName, existingFunders });
    const rows = validRows(preview);
    if (rows.length === 0) return null;

    const existingFunderIds = new Map<string, string>();
    const newFunderRows = new Map<string, PortfolioImportPreviewRow>();
    for (const row of rows) {
      const funder = row.funder!;
      const decision = row.funderDecision!;
      if (decision.kind === "reuse") {
        existingFunderIds.set(funder.normalizedName, decision.funderId);
      } else if (decision.kind === "create" && !newFunderRows.has(funder.normalizedName)) {
        newFunderRows.set(funder.normalizedName, row);
      }
    }

    const newFunderData = [...newFunderRows.entries()].map(([normalizedName, row]) => ({
      id: randomUUID(),
      organizationId: authorization.organizationId,
      name: row.funder!.name,
      type: row.funder!.type,
      normalizedName,
    }));
    const createdFunders = newFunderData.length > 0
      ? await tx.funder.createManyAndReturn({
          data: newFunderData.map(({ id, organizationId, name, type }) => ({ id, organizationId, name, type })),
          select: { id: true },
        })
      : [];
    if (createdFunders.length !== newFunderData.length) {
      throw new Error("The imported Funders could not be created completely.");
    }

    const returnedFunderIds = new Set(createdFunders.map((funder) => funder.id));
    const funderIds = new Map(existingFunderIds);
    for (const funder of newFunderData) {
      // IDs are assigned before the bulk insert so the map cannot depend on
      // the database's return order from createManyAndReturn.
      if (!returnedFunderIds.has(funder.id)) throw new Error("The imported Funder IDs could not be resolved.");
      funderIds.set(funder.normalizedName, funder.id);
    }

    const grantData = rows.map((row) => {
      const funderId = funderIds.get(row.funder!.normalizedName);
      if (!funderId) throw new Error("The imported Funder could not be resolved.");
      const grant = row.grant!;
      return {
        id: randomUUID(),
        organizationId: authorization.organizationId,
        funderId,
        title: grant.title,
        status: databaseStatus(grant.status),
        amountRequested: grant.amountRequested,
        amountAwarded: grant.amountAwarded,
        currency: grant.currency,
        deadline: databaseDate(grant.deadline),
        decisionDate: databaseDate(grant.decisionDate),
        awardTimeframe: grant.awardTimeframe,
        designation: grant.designation,
        countyServed: grant.countyServed,
        nextSteps: grant.nextSteps,
        notes: grant.notes,
        ownerId: authorization.userId,
        createdById: authorization.userId,
      };
    });
    const createdGrants = await tx.grant.createManyAndReturn({
      data: grantData,
      select: { id: true },
    });
    if (createdGrants.length !== grantData.length) {
      throw new Error("The imported Grants could not be created completely.");
    }

    const funderActivities = newFunderData.map((funder) => {
      const row = newFunderRows.get(funder.normalizedName)!;
      const funderId = funderIds.get(funder.normalizedName);
      if (!funderId) throw new Error("The imported Funder could not be resolved for Activity.");
      return {
        organizationId: authorization.organizationId,
        funderId,
        action: "funder_created",
        description: `Created funder ${funder.name}.`,
        actorId: authorization.userId,
        metadata: importMetadata(preview, row, importBatchId),
      };
    });
    const grantActivities = grantData.map((grant, index) => ({
      organizationId: authorization.organizationId,
      grantId: grant.id,
      action: "grant_created",
      description: `Created grant ${grant.title}.`,
      actorId: authorization.userId,
      metadata: { ...importMetadata(preview, rows[index], importBatchId), status: grant.status },
    }));
    await tx.activity.createMany({ data: [...funderActivities, ...grantActivities] });

    return {
      worksheet: preview.worksheet,
      importBatchId,
      counts: {
        createdFunders: newFunderData.length,
        reusedFunders: new Set(
          rows.flatMap((row) => {
            const decision = row.funderDecision;
            return decision?.kind === "reuse" ? [decision.funderId] : [];
          }),
        ).size,
        createdGrants: grantData.length,
        collapsed: preview.counts.collapsed,
        excluded: preview.counts.invalid,
        structural: preview.counts.structural,
      },
    };
  });
}

export async function analyzePortfolioImport(formData: FormData): Promise<AnalyzePortfolioImportResult> {
  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;

  try {
    const { bytes, fileName } = await readUpload(formData);
    const existingFunders = await activeFundersForOrganization(authorization.organizationId);
    return { success: true, data: parsePortfolioWorkbook(bytes, { fileName, existingFunders }) };
  } catch (error) {
    return actionError(error, "The workbook could not be analyzed.");
  }
}

export async function confirmPortfolioImport(formData: FormData): Promise<ConfirmPortfolioImportResult> {
  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;
  if (!acknowledgementProvided(formData)) {
    return { success: false, error: "Review the valid rows and acknowledge that this import will create new GrantFlow grant records." };
  }

  try {
    const { bytes, fileName } = await readUpload(formData);
    const importBatchId = randomUUID();
    const result = await confirmInTransaction(bytes, fileName, authorization, importBatchId);
    if (!result) return { success: false, error: "No valid grants are available to import." };
    revalidatePath("/grants");
    revalidatePath("/funders");
    return { success: true, data: result };
  } catch (error) {
    return actionError(error, "The import could not be completed. No records were created.");
  }
}
