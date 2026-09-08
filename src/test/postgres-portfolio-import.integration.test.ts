import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const authMock = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));

const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const describePostgres = describe.skipIf(!enabled);
const execFileAsync = promisify(execFile);
const timeout = 120_000;

let admin: Pool | undefined;
let db: PrismaClient | undefined;
let appPrisma: typeof import("@/lib/prisma").prisma | undefined;
let testDatabaseName = "";
let orgAId = "";
let orgBId = "";
let userAId = "";

let actions: typeof import("@/app/(authenticated)/(org-required)/import/actions") | undefined;

function databaseName(): string {
  return `grantflow_import_test_${randomUUID().replaceAll("-", "")}`;
}

function withDatabase(url: string, name: string): string {
  const parsed = new URL(url);
  if (!parsed.username && process.env.USER) parsed.username = process.env.USER;
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

function setSession(userId: string | null): void {
  authMock.mockResolvedValue({ userId });
}

function importFile(rows: unknown[][]): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Tracker");
  return new File([XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })], "tracker.xlsx");
}

function formData(rows: unknown[][], acknowledged = true): FormData {
  const data = new FormData();
  data.append("file", importFile(rows));
  if (acknowledged) data.append("acknowledged", "true");
  return data;
}

describePostgres("PostgreSQL portfolio import isolation and atomic persistence", () => {
  const headers = ["Funder", "Type", "Current Status", "Designation", "County Served", "Notes"];

  async function cleanup(): Promise<void> {
    const errors: unknown[] = [];
    for (const client of [appPrisma, db]) {
      if (!client) continue;
      try {
        await client.$disconnect();
      } catch (error) {
        errors.push(error);
      }
    }
    appPrisma = undefined;
    db = undefined;
    if (admin && testDatabaseName) {
      try {
        await admin.query(`DROP DATABASE IF EXISTS "${testDatabaseName}"`);
      } catch (error) {
        errors.push(error);
      }
    }
    if (admin) {
      try {
        await admin.end();
      } catch (error) {
        errors.push(error);
      }
    }
    admin = undefined;
    if (errors.length > 0) throw new AggregateError(errors, "portfolio import integration cleanup failed");
  }

  beforeAll(async () => {
    const adminUrl = process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL as string;
    testDatabaseName = databaseName();
    admin = new Pool({ connectionString: adminUrl });
    const databaseUrl = withDatabase(adminUrl, testDatabaseName);

    try {
      await admin.query(`CREATE DATABASE "${testDatabaseName}"`);
      await execFileAsync("npx", ["prisma", "migrate", "deploy"], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        timeout,
      });
      process.env.DATABASE_URL = databaseUrl;
      db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
      const orgA = await db.organization.create({ data: { name: "Import A" } });
      const orgB = await db.organization.create({ data: { name: "Import B" } });
      orgAId = orgA.id;
      orgBId = orgB.id;
      const userA = await db.user.create({ data: { clerkUserId: "import-user-a", organizationId: orgAId } });
      await db.user.create({ data: { clerkUserId: "import-user-b", organizationId: orgBId } });
      userAId = userA.id;
      await db.funder.create({ data: { organizationId: orgAId, name: "Existing Funder", type: "FOUNDATION" } });
      await db.funder.create({ data: { organizationId: orgBId, name: "New Funder", type: "CORPORATION" } });
      appPrisma = (await import("@/lib/prisma")).prisma;
      actions = await import("@/app/(authenticated)/(org-required)/import/actions");
    } catch (error) {
      try {
        await cleanup();
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "portfolio import integration setup and cleanup failed");
      }
      throw error;
    }
  }, timeout);

  afterAll(cleanup, timeout);

  beforeEach(() => authMock.mockReset());

  it("re-resolves only the authorized organization's active Funders and commits bulk domain records", async () => {
    setSession("import-user-a");
    const rows = [
      headers,
      [" Existing   Funder ", "Other", "Submitted", "Program"],
      [" Existing   Funder ", "Other", "Submitted", "Program"],
      ["New Funder", "Foundation", "To Apply", "Opportunity", "Imported County", "Imported Notes"],
    ];

    const preview = await actions!.analyzePortfolioImport(formData(rows, false));
    expect(preview.success).toBe(true);
    const result = await actions!.confirmPortfolioImport(formData(rows));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.counts).toMatchObject({ createdFunders: 1, reusedFunders: 1, createdGrants: 2, collapsed: 1, excluded: 0 });

    const funders = await db!.funder.findMany({ where: { organizationId: orgAId }, orderBy: { name: "asc" } });
    expect(funders.map((funder) => funder.name)).toEqual(["Existing Funder", "New Funder"]);
    expect(await db!.funder.count({ where: { organizationId: orgBId, name: "New Funder" } })).toBe(1);

    const grants = await db!.grant.findMany({ where: { organizationId: orgAId } });
    expect(grants).toHaveLength(2);
    expect(grants.every((grant) => grant.ownerId === userAId && grant.createdById === userAId)).toBe(true);
    expect(grants.find((grant) => grant.title === "New Funder — Opportunity")).toMatchObject({ countyServed: "Imported County", notes: "Imported Notes" });
    expect(await db!.funder.findFirst({ where: { organizationId: orgAId, name: "New Funder" }, select: { countyServed: true, notes: true } })).toEqual({ countyServed: null, notes: null });
    expect(await db!.activity.count({ where: { organizationId: orgAId, action: "funder_created" } })).toBe(1);
    expect(await db!.activity.count({ where: { organizationId: orgAId, action: "grant_created" } })).toBe(2);
    expect(await db!.activity.count({ where: { organizationId: orgBId } })).toBe(0);
  });
});
