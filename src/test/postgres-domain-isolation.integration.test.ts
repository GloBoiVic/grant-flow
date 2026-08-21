import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Control the signed Clerk session per scenario so the real authorization +
// projection path runs against the disposable database.
const authMock = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));

/**
 * Opt-in database-backed domain/tenant isolation gate. Follows the disposable
 * PostgreSQL pattern from postgres-onboarding.integration.test.ts: a fresh
 * database is created, every checked-in migration is applied, and the real
 * domain actions/queries run against it with a per-scenario Clerk session.
 * GRANTFLOW_TEST_DATABASE_ADMIN_URL must point at a disposable server/database
 * owner.
 */
const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const execFileAsync = promisify(execFile);
const describePostgres = describe.skipIf(!enabled);
const lifecycleTimeoutMs = 120_000;

let databaseUrl = "";
let testDatabaseName = "";
let admin: Pool | undefined;
let db: PrismaClient | undefined;

let actions: typeof import("@/app/(authenticated)/(org-required)/grants/actions") | undefined;
let funderQueries: typeof import("@/lib/queries/funders") | undefined;
let grantQueries: typeof import("@/lib/queries/grants") | undefined;
let activityQueries: typeof import("@/lib/queries/activities") | undefined;
let appPrisma: typeof import("@/lib/prisma").prisma | undefined;

let orgAId = "";
let orgBId = "";
let userAId = "";
let funderAId = "";
let funderBId = "";
let funderASoftDeletedId = "";
let grantAId = "";
let grantBId = "";
let grantASoftDeletedId = "";
let grantAStatusId = "";

function databaseName(): string {
  return `grantflow_domain_test_${randomUUID().replaceAll("-", "")}`;
}

function withDatabase(url: string, name: string): string {
  const parsed = new URL(url);
  if (!parsed.username && process.env.USER) parsed.username = process.env.USER;
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

function setSession(userId: string | null, orgId: string | null, orgRole: string | null): void {
  authMock.mockResolvedValue({ userId, orgId, orgRole });
}

async function seedDatabase(client: PrismaClient): Promise<void> {
  const orgA = await client.organization.create({ data: { clerkOrgId: "org_aaaa", name: "Org A", slug: `org-a-${randomUUID()}` } });
  const orgB = await client.organization.create({ data: { clerkOrgId: "org_bbbb", name: "Org B", slug: `org-b-${randomUUID()}` } });
  orgAId = orgA.id;
  orgBId = orgB.id;

  const userA = await client.user.create({ data: { clerkUserId: "user_aaaa", email: `a-${randomUUID()}@example.com`, name: "User A" } });
  const userB = await client.user.create({ data: { clerkUserId: "user_bbbb", email: `b-${randomUUID()}@example.com`, name: "User B" } });
  userAId = userA.id;

  const funderA = await client.funder.create({ data: { organizationId: orgA.id, name: "Org A Funder", type: "FOUNDATION" } });
  const funderB = await client.funder.create({ data: { organizationId: orgB.id, name: "Org B Funder", type: "CORPORATION" } });
  const funderASoftDeleted = await client.funder.create({
    data: { organizationId: orgA.id, name: "Soft Deleted Funder", type: "OTHER", deletedAt: new Date("2026-08-01T00:00:00.000Z") },
  });
  funderAId = funderA.id;
  funderBId = funderB.id;
  funderASoftDeletedId = funderASoftDeleted.id;

  const grantA = await client.grant.create({
    data: { organizationId: orgA.id, funderId: funderA.id, title: "Org A Grant", status: "Research", ownerId: userA.id, createdById: userA.id },
  });
  const grantB = await client.grant.create({
    data: { organizationId: orgB.id, funderId: funderB.id, title: "Org B Grant", status: "Writing", ownerId: userB.id, createdById: userB.id },
  });
  const grantASoftDeleted = await client.grant.create({
    data: { organizationId: orgA.id, funderId: funderA.id, title: "Soft Deleted Grant", status: "Declined", ownerId: userA.id, createdById: userA.id, deletedAt: new Date("2026-08-02T00:00:00.000Z") },
  });
  const grantAStatus = await client.grant.create({
    data: { organizationId: orgA.id, funderId: funderA.id, title: "Status Grant", status: "Qualified", ownerId: userA.id, createdById: userA.id },
  });
  grantAId = grantA.id;
  grantBId = grantB.id;
  grantASoftDeletedId = grantASoftDeleted.id;
  grantAStatusId = grantAStatus.id;
}

describePostgres("fresh PostgreSQL domain tenant isolation", () => {
  async function cleanup(): Promise<void> {
    const errors: unknown[] = [];

    if (appPrisma) {
      try {
        await appPrisma.$disconnect();
      } catch (error) {
        errors.push(error);
      }
    }
    appPrisma = undefined;

    if (db) {
      try {
        await db.$disconnect();
      } catch (error) {
        errors.push(error);
      }
    }
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

    if (errors.length > 0) {
      throw new AggregateError(errors, "PostgreSQL domain tenant isolation cleanup failed");
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

      process.env.DATABASE_URL = databaseUrl;
      db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
      await seedDatabase(db);

      appPrisma = (await import("@/lib/prisma")).prisma;
      actions = await import("@/app/(authenticated)/(org-required)/grants/actions");
      funderQueries = await import("@/lib/queries/funders");
      grantQueries = await import("@/lib/queries/grants");
      activityQueries = await import("@/lib/queries/activities");
    } catch (setupError) {
      try {
        await cleanup();
      } catch (cleanupError) {
        throw new AggregateError(
          [setupError, cleanupError],
          "PostgreSQL domain tenant isolation setup and cleanup failed",
        );
      }
      throw setupError;
    }
  }, lifecycleTimeoutMs);

  afterAll(cleanup, lifecycleTimeoutMs);

  beforeEach(() => {
    authMock.mockReset();
  });

  it("does not list another organization's funders or soft-deleted funders", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await funderQueries!.listFunders();
    const ids = result.items.map((f) => f.id);
    expect(ids).toContain(funderAId);
    expect(ids).not.toContain(funderBId);
    expect(ids).not.toContain(funderASoftDeletedId);
  });

  it("does not list another organization's grants or soft-deleted grants", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await grantQueries!.listGrants();
    const ids = result.items.map((g) => g.id);
    expect(ids).toContain(grantAId);
    expect(ids).not.toContain(grantBId);
    expect(ids).not.toContain(grantASoftDeletedId);
  });

  it("returns another organization's grant and a soft-deleted grant as missing on read", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    expect(await grantQueries!.getGrant(grantBId)).toBeNull();
    expect(await grantQueries!.getGrant(grantASoftDeletedId)).toBeNull();
  });

  it("does not expose another organization's activities", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    expect(await activityQueries!.listActivities({ grantId: grantBId })).toEqual([]);
  });

  it("cannot edit another organization's grant (no change, no activity)", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const before = await db!.grant.findUnique({ where: { id: grantBId }, select: { title: true } });
    const result = await actions!.editGrant({ grantId: grantBId, title: "Hacked title" });
    expect(result.success).toBe(false);
    const after = await db!.grant.findUnique({ where: { id: grantBId }, select: { title: true } });
    expect(after?.title).toBe(before?.title);
    expect(await db!.activity.count({ where: { grantId: grantBId } })).toBe(0);
  });

  it("cannot status-change another organization's grant (no change, no activity)", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await actions!.changeGrantStatus({ grantId: grantBId, status: "Awarded" });
    expect(result).toEqual({ success: false, error: "Grant not found." });
    const grant = await db!.grant.findUnique({ where: { id: grantBId }, select: { status: true } });
    expect(grant?.status).toBe("Writing");
    expect(await db!.activity.count({ where: { grantId: grantBId } })).toBe(0);
  });

  it("cannot create a grant attached to another organization's funder", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const before = await db!.grant.count({ where: { organizationId: orgAId } });
    const beforeActivities = await db!.activity.count();
    const result = await actions!.createGrant({ funderId: funderBId, title: "Attempt", status: "Research" });
    expect(result).toEqual({ success: false, error: "Funder not found." });
    expect(await db!.grant.count({ where: { organizationId: orgAId } })).toBe(before);
    expect(await db!.activity.count()).toBe(beforeActivities);
  });

  it("cannot re-attach a grant to another organization's funder via edit", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await actions!.editGrant({ grantId: grantAId, funderId: funderBId });
    expect(result).toEqual({ success: false, error: "Grant or funder not found." });
    const grant = await db!.grant.findUnique({ where: { id: grantAId }, select: { funderId: true } });
    expect(grant?.funderId).toBe(funderAId);
    expect(await db!.activity.count({ where: { grantId: grantAId } })).toBe(0);
  });

  it("cannot create a grant attached to a soft-deleted funder", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const before = await db!.grant.count({ where: { organizationId: orgAId } });
    const result = await actions!.createGrant({ funderId: funderASoftDeletedId, title: "Attempt", status: "Research" });
    expect(result).toEqual({ success: false, error: "Funder not found." });
    expect(await db!.grant.count({ where: { organizationId: orgAId } })).toBe(before);
  });

  it("produces no domain change or activity for invalid funder details", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const beforeFunders = await db!.funder.count({ where: { organizationId: orgAId } });
    const beforeActivities = await db!.activity.count();
    const result = await actions!.createFunder({ name: "", type: "FOUNDATION" });
    expect(result.success).toBe(false);
    expect(await db!.funder.count({ where: { organizationId: orgAId } })).toBe(beforeFunders);
    expect(await db!.activity.count()).toBe(beforeActivities);
  });

  it("rejects server-owned fields and invalid grant details with no domain change or activity", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const beforeGrants = await db!.grant.count({ where: { organizationId: orgAId } });
    const beforeActivities = await db!.activity.count();
    const serverOwned = await actions!.createGrant({ funderId: funderAId, title: "Grant", status: "Research", organizationId: orgBId });
    expect(serverOwned.success).toBe(false);
    const invalid = await actions!.createGrant({ funderId: funderAId, title: "", status: "Research" });
    expect(invalid.success).toBe(false);
    expect(await db!.grant.count({ where: { organizationId: orgAId } })).toBe(beforeGrants);
    expect(await db!.activity.count()).toBe(beforeActivities);
  });

  it("produces no domain change or activity when unauthenticated", async () => {
    setSession(null, null, null);
    const beforeFunders = await db!.funder.count();
    const beforeActivities = await db!.activity.count();
    const result = await actions!.createFunder({ name: "No Auth", type: "FOUNDATION" });
    expect(result).toMatchObject({ success: false, error: "Unauthorized" });
    expect(await db!.funder.count()).toBe(beforeFunders);
    expect(await db!.activity.count()).toBe(beforeActivities);
  });

  it("creates a funder and its append-only funder_created activity atomically", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await actions!.createFunder({ name: "Fresh Funder", type: "CORPORATION", website: "https://example.com" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const funder = await db!.funder.findUnique({
      where: { id: result.data.id },
      select: { organizationId: true, name: true, type: true, website: true },
    });
    expect(funder?.organizationId).toBe(orgAId);
    expect(funder?.name).toBe("Fresh Funder");
    expect(funder?.type).toBe("CORPORATION");
    const activity = await db!.activity.findFirst({ where: { funderId: result.data.id, action: "funder_created" } });
    expect(activity).not.toBeNull();
    expect(activity?.organizationId).toBe(orgAId);
    expect(activity?.actorId).toBe(userAId);
  });

  it("creates a grant and its grant_created activity atomically with actor and metadata", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await actions!.createGrant({
      funderId: funderAId,
      title: "Program Grant",
      status: "Planning",
      amountRequested: "1000.00",
      deadline: "2026-12-31",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const grant = await db!.grant.findUnique({
      where: { id: result.data.id },
      select: { organizationId: true, funderId: true, ownerId: true, createdById: true, status: true },
    });
    expect(grant?.organizationId).toBe(orgAId);
    expect(grant?.funderId).toBe(funderAId);
    expect(grant?.ownerId).toBe(userAId);
    expect(grant?.createdById).toBe(userAId);
    expect(grant?.status).toBe("Planning");
    const activity = await db!.activity.findFirst({ where: { grantId: result.data.id, action: "grant_created" } });
    expect(activity).not.toBeNull();
    expect(activity?.organizationId).toBe(orgAId);
    expect(activity?.actorId).toBe(userAId);
    const metadata = activity?.metadata as { status?: string } | null;
    expect(metadata?.status).toBe("Planning");
  });

  it("edits a grant and appends a grant_updated activity atomically", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await actions!.editGrant({ grantId: grantAId, title: "Updated Title" });
    expect(result.success).toBe(true);
    const grant = await db!.grant.findUnique({ where: { id: grantAId }, select: { title: true } });
    expect(grant?.title).toBe("Updated Title");
    const activity = await db!.activity.findFirst({ where: { grantId: grantAId, action: "grant_updated" } });
    expect(activity).not.toBeNull();
    expect(activity?.organizationId).toBe(orgAId);
  });

  it("changes grant status and appends an append-only status_changed activity atomically", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const result = await actions!.changeGrantStatus({ grantId: grantAId, status: "Awarded" });
    expect(result.success).toBe(true);
    const grant = await db!.grant.findUnique({ where: { id: grantAId }, select: { status: true } });
    expect(grant?.status).toBe("Awarded");
    const activity = await db!.activity.findFirst({
      where: { grantId: grantAId, action: "status_changed" },
      orderBy: { createdAt: "desc" },
    });
    expect(activity).not.toBeNull();
    const metadata = activity?.metadata as { previousStatus?: string; newStatus?: string } | null;
    expect(metadata?.previousStatus).toBe("Research");
    expect(metadata?.newStatus).toBe("Awarded");
  });

  it("writes no activity for a same-status submission", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const before = await db!.activity.count({ where: { grantId: grantAStatusId } });
    const result = await actions!.changeGrantStatus({ grantId: grantAStatusId, status: "Qualified" });
    expect(result.success).toBe(true);
    const grant = await db!.grant.findUnique({ where: { id: grantAStatusId }, select: { status: true } });
    expect(grant?.status).toBe("Qualified");
    expect(await db!.activity.count({ where: { grantId: grantAStatusId } })).toBe(before);
  });

  it("permits funder and grant creation for org:member", async () => {
    setSession("user_aaaa", "org_aaaa", "org:member");
    const funder = await actions!.createFunder({ name: "Member Funder", type: "OTHER" });
    expect(funder.success).toBe(true);
    const grant = await actions!.createGrant({ funderId: funderAId, title: "Member Grant", status: "Writing" });
    expect(grant.success).toBe(true);
  });

  it("permits funder creation for org:admin", async () => {
    setSession("user_aaaa", "org_aaaa", "org:admin");
    const result = await actions!.createFunder({ name: "Admin Funder", type: "OTHER" });
    expect(result.success).toBe(true);
  });
});
