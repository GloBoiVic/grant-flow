import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { PrismaClient } from "@/generated/prisma/client";
import {
  acquireOnboardingLeaseWithDb,
  finalizeOnboardingLeaseWithDb,
  renewOnboardingLeaseWithDb,
} from "@/lib/clerk/onboarding";

/**
 * Opt-in integration gate. GRANTFLOW_TEST_DATABASE_ADMIN_URL must point at a
 * disposable PostgreSQL server/database owner. The test creates a new database,
 * applies every checked-in migration, and uses two independent Prisma clients.
 */
const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const execFileAsync = promisify(execFile);
const describePostgres = describe.skipIf(!enabled);
const lifecycleTimeoutMs = 120_000;

let databaseUrl = "";
let testDatabaseName = "";
let admin: Pool | undefined;
let left: PrismaClient | undefined;
let right: PrismaClient | undefined;

function databaseName(): string {
  return `grantflow_test_${randomUUID().replaceAll("-", "")}`;
}

function withDatabase(url: string, name: string): string {
  const parsed = new URL(url);
  if (!parsed.username && process.env.USER) parsed.username = process.env.USER;
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

describePostgres("fresh PostgreSQL onboarding lease integration", () => {
  async function cleanup(): Promise<void> {
    const errors: unknown[] = [];

    for (const client of [left, right]) {
      if (!client) continue;
      try {
        await client.$disconnect();
      } catch (error) {
        errors.push(error);
      }
    }
    left = undefined;
    right = undefined;

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

    if (errors.length > 0) {
      throw new AggregateError(errors, "PostgreSQL onboarding integration cleanup failed");
    }
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

      left = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
      right = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    } catch (setupError) {
      try {
        await cleanup();
      } catch (cleanupError) {
        throw new AggregateError(
          [setupError, cleanupError],
          "PostgreSQL onboarding integration setup and cleanup failed",
        );
      }
      throw setupError;
    }
  }, lifecycleTimeoutMs);

  afterAll(cleanup, lifecycleTimeoutMs);

  it("enforces lease ownership and expiry across independent clients", async () => {
    const leftClient = left;
    const rightClient = right;
    if (!leftClient || !rightClient) throw new Error("PostgreSQL onboarding clients were not initialized");

    const claim = await leftClient.onboardingClaim.create({
      data: { clerkUserId: `user_${randomUUID()}`, name: "Integration Org", slug: `integration-${randomUUID()}` },
    });

    const [first, second] = await Promise.all([
      acquireOnboardingLeaseWithDb(leftClient, claim),
      acquireOnboardingLeaseWithDb(rightClient, claim),
    ]);
    expect([first.status, second.status].sort()).toEqual(["acquired", "busy"]);
    const owner = first.status === "acquired" ? first : second;
    if (owner.status !== "acquired") throw new Error("expected one lease owner");
    const staleToken = owner.leaseToken;

    await leftClient.onboardingClaim.update({
      where: { id: claim.id },
      data: { createLeaseExpiresAt: new Date(Date.now() - 1) },
    });
    expect(await renewOnboardingLeaseWithDb(rightClient, claim.id, staleToken)).toBe(false);
    expect(await finalizeOnboardingLeaseWithDb(rightClient, claim.id, staleToken, "org_stale")).toBeNull();

    const recovered = await acquireOnboardingLeaseWithDb(rightClient, claim);
    expect(recovered.status).toBe("acquired");
    if (recovered.status !== "acquired") return;
    expect(await finalizeOnboardingLeaseWithDb(rightClient, claim.id, recovered.leaseToken, "org_recovered")).toBe("org_recovered");
    await expect(leftClient.onboardingClaim.findUnique({ where: { id: claim.id } })).resolves.toMatchObject({ clerkOrgId: "org_recovered" });
  });
});
