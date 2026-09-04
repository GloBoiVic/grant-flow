import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

vi.mock("server-only", () => ({}));
const authMock = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));

/**
 * Opt-in integration gate. GRANTFLOW_TEST_DATABASE_ADMIN_URL must point at a
 * disposable PostgreSQL server/database owner. Each test database receives
 * the clean local-tenancy baseline before the real onboarding action runs.
 */
const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const describePostgres = describe.skipIf(!enabled);
const execFileAsync = promisify(execFile);
const lifecycleTimeoutMs = 120_000;

let testDatabaseName = "";
let databaseUrl = "";
let admin: Pool | undefined;
let db: PrismaClient | undefined;
let appPrisma: typeof import("@/lib/prisma").prisma | undefined;
let createFirstOrganization: typeof import("@/app/(authenticated)/organization/actions").createFirstOrganization;
let currentClerkUser = "";

function databaseName(): string {
  return `grantflow_onboarding_test_${randomUUID().replaceAll("-", "")}`;
}

function withDatabase(url: string, name: string): string {
  const parsed = new URL(url);
  if (!parsed.username && process.env.USER) parsed.username = process.env.USER;
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

describePostgres("fresh PostgreSQL local onboarding", () => {
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
    if (errors.length > 0) throw new AggregateError(errors, "PostgreSQL onboarding cleanup failed");
  }

  beforeAll(async () => {
    const adminUrl = process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL as string;
    testDatabaseName = databaseName();
    admin = new Pool({ connectionString: adminUrl });
    databaseUrl = withDatabase(adminUrl, testDatabaseName);

    try {
      await admin.query(`CREATE DATABASE "${testDatabaseName}"`);
      await execFileAsync("npx", ["prisma", "migrate", "deploy"], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        timeout: lifecycleTimeoutMs,
      });
      process.env.DATABASE_URL = databaseUrl;
      db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
      appPrisma = (await import("@/lib/prisma")).prisma;
      ({ createFirstOrganization } = await import("@/app/(authenticated)/organization/actions"));
    } catch (setupError) {
      try {
        await cleanup();
      } catch (cleanupError) {
        throw new AggregateError([setupError, cleanupError], "PostgreSQL onboarding setup and cleanup failed");
      }
      throw setupError;
    }
  }, lifecycleTimeoutMs);

  afterAll(cleanup, lifecycleTimeoutMs);

  beforeEach(async () => {
    if (!db) throw new Error("PostgreSQL onboarding client was not initialized");
    await db.user.deleteMany();
    await db.organization.deleteMany();

    authMock.mockReset();
    currentClerkUser = `clerk-race-${randomUUID()}`;
    authMock.mockResolvedValue({ userId: currentClerkUser });
  });

  it("converges concurrent first-user writes on one User and Organization", async () => {
    const results = await Promise.all([
      createFirstOrganization({ name: "First submitted name" }),
      createFirstOrganization({ name: "Second submitted name" }),
    ]);

    expect(results.filter((result) => result.success)).toHaveLength(2);
    const first = results[0];
    const second = results[1];
    if (!first?.success || !second?.success) return;
    expect(new Set([first.organizationId, second.organizationId]).size).toBe(1);
    expect([first.status, second.status].sort()).toEqual(["created", "existing"]);
    expect(await db!.user.count({ where: { clerkUserId: currentClerkUser } })).toBe(1);
    expect(await db!.organization.count()).toBe(1);
  });

  it("returns the existing tenant on a later request without renaming it", async () => {
    const first = await createFirstOrganization({ name: "Original name" });
    const second = await createFirstOrganization({ name: "Ignored rename" });

    expect(first).toMatchObject({ success: true, status: "created" });
    expect(second).toMatchObject({ success: true, status: "existing" });
    expect(await db!.organization.findFirst({ select: { name: true } })).toEqual({ name: "Original name" });
  });
});
