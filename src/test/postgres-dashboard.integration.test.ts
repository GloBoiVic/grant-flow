import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));

/**
 * Disposable PostgreSQL dashboard aggregation gate.
 * Follows domain-isolation import pattern: fresh DB, migrate deploy, seed, verify.
 * GRANTFLOW_TEST_DATABASE_ADMIN_URL must point at disposable owner.
 */
const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const execFileAsync = promisify(execFile);
const describePostgres = describe.skipIf(!enabled);
const lifecycleTimeoutMs = 120_000;

let databaseUrl = "";
let testDatabaseName = "";
let admin: Pool | undefined;
let db: PrismaClient | undefined;
let appPrisma: typeof import("@/lib/prisma").prisma | undefined;
let dashboard: typeof import("@/lib/queries/dashboard") | undefined;

// Helper IDs for later assertions
let gTodayId = "";
let gPlus7Id = "";
let gPlus8Id = "";
let gPlus30Id = "";
let gPlus31Id = "";
let tieAId = "";
let tieBId = "";

function databaseName(): string {
  return `grantflow_dashboard_test_${randomUUID().replaceAll("-", "")}`;
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
function utc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

async function seedDatabase(client: PrismaClient): Promise<void> {
  const orgA = await client.organization.create({ data: { name: "Dashboard Org A" } });
  const orgB = await client.organization.create({ data: { name: "Dashboard Org B" } });

  const userA = await client.user.create({ data: { clerkUserId: "dash_user_a", organizationId: orgA.id } });
  const userB = await client.user.create({ data: { clerkUserId: "dash_user_b", organizationId: orgB.id } });

  const funderA = await client.funder.create({ data: { organizationId: orgA.id, name: "Funder A", type: "FOUNDATION" } });
  const funderB = await client.funder.create({ data: { organizationId: orgB.id, name: "Funder B", type: "CORPORATION" } });
  const funderASoftDeleted = await client.funder.create({
    data: { organizationId: orgA.id, name: "Soft Deleted Funder A", type: "OTHER", deletedAt: utc("2026-08-01") },
  });

  // Boundaries with fixed today 2026-09-04
  await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Overdue Research",
      status: "Research",
      amountRequested: "100.00",
      amountAwarded: "10.00",
      deadline: utc("2026-09-03"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  const gToday = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Today Qualified",
      status: "Qualified",
      amountRequested: "200.00",
      amountAwarded: null,
      deadline: utc("2026-09-04"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  const gPlus7 = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Plus7 Planning",
      status: "Planning",
      amountRequested: null,
      amountAwarded: "30.00",
      deadline: utc("2026-09-11"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  const gPlus8 = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Plus8 Writing",
      status: "Writing",
      amountRequested: "400.00",
      amountAwarded: null,
      deadline: utc("2026-09-12"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  const gPlus30 = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Plus30 Internal",
      status: "InternalReview",
      amountRequested: "500.00",
      amountAwarded: "50.00",
      deadline: utc("2026-10-04"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  const gPlus31 = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Plus31 Research",
      status: "Research",
      amountRequested: "600.00",
      amountAwarded: "60.00",
      deadline: utc("2026-10-05"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Null Deadline",
      status: "Research",
      amountRequested: null,
      amountAwarded: null,
      deadline: null,
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  // Submitted with today deadline — must NOT be in attention/upcoming
  await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Submitted Today",
      status: "Submitted",
      amountRequested: "700.00",
      amountAwarded: null,
      deadline: utc("2026-09-04"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  // Awarded overdue — must NOT be overdue
  await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Awarded Overdue",
      status: "Awarded",
      amountRequested: null,
      amountAwarded: "999.00",
      deadline: utc("2026-09-03"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  // Tie deadline 2026-09-05 two grants, different ids for ordering test
  const tieA = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Tie A",
      status: "Research",
      deadline: utc("2026-09-05"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  const tieB = await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Tie B",
      status: "Qualified",
      deadline: utc("2026-09-05"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });

  gTodayId = gToday.id;
  gPlus7Id = gPlus7.id;
  gPlus8Id = gPlus8.id;
  gPlus30Id = gPlus30.id;
  gPlus31Id = gPlus31.id;
  tieAId = tieA.id;
  tieBId = tieB.id;

  // Soft-deleted grant (should be excluded everywhere)
  await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderA.id,
      title: "Soft Deleted Grant",
      status: "Research",
      amountRequested: "9999.00",
      amountAwarded: "9999.00",
      deadline: utc("2026-09-04"),
      deletedAt: utc("2026-08-02"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  // Grant whose funder is soft-deleted (must be excluded)
  await client.grant.create({
    data: {
      organizationId: orgA.id,
      funderId: funderASoftDeleted.id,
      title: "Soft Funder Grant",
      status: "Research",
      amountRequested: "8888.00",
      deadline: utc("2026-09-04"),
      ownerId: userA.id,
      createdById: userA.id,
    },
  });
  // Other org grant — must be isolated
  await client.grant.create({
    data: {
      organizationId: orgB.id,
      funderId: funderB.id,
      title: "Other Org Grant",
      status: "Research",
      amountRequested: "7777.00",
      amountAwarded: "777.00",
      deadline: utc("2026-09-03"),
      ownerId: userB.id,
      createdById: userB.id,
    },
  });
  // Other org shouldn't affect counts; ensure at least one other pending
  await client.grant.create({
    data: {
      organizationId: orgB.id,
      funderId: funderB.id,
      title: "Other Org Upcoming",
      status: "Qualified",
      deadline: utc("2026-09-04"),
      ownerId: userB.id,
      createdById: userB.id,
    },
  });

  // Ensure tie ids ordered lexicographically for deterministic test (smaller id first)
  // We will sort expectation by id ASC as Prisma does
  if (tieAId > tieBId) {
    // swap for expectation reasoning — but we keep recorded ids
  }
}

describePostgres("PostgreSQL dashboard isolation and deadline windows", () => {
  async function cleanup(): Promise<void> {
    const errors: unknown[] = [];
    if (appPrisma) {
      try { await appPrisma.$disconnect(); } catch (e) { errors.push(e); }
    }
    appPrisma = undefined;
    if (db) {
      try { await db.$disconnect(); } catch (e) { errors.push(e); }
    }
    db = undefined;
    if (admin && testDatabaseName) {
      try { await admin.query(`DROP DATABASE IF EXISTS "${testDatabaseName}"`); } catch (e) { errors.push(e); }
    }
    if (admin) {
      try { await admin.end(); } catch (e) { errors.push(e); }
    }
    admin = undefined;
    if (errors.length > 0) throw new AggregateError(errors, "dashboard integration cleanup failed");
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
      dashboard = await import("@/lib/queries/dashboard");
    } catch (setupError) {
      try { await cleanup(); } catch (cleanupError) {
        throw new AggregateError([setupError, cleanupError], "setup and cleanup failed");
      }
      throw setupError;
    }
  }, lifecycleTimeoutMs);

  afterAll(cleanup, lifecycleTimeoutMs);
  beforeEach(() => authMock.mockReset());

  it("verifies organization and soft-delete isolation with exact aggregates", async () => {
    setSession("dash_user_a");
    const dto = await dashboard!.getDashboard({ today: utc("2026-09-04") });

    // Tracked grants: count of orgA active grants with active same-org funder
    // Seeded active grants for orgA: gOverdue, gToday, gPlus7, gPlus8, gPlus30, gPlus31, gNull, Submitted Today, Awarded Overdue, tieA, tieB = 11
    // (soft-deleted grant + soft-funder grant excluded, other org excluded)
    expect(dto.totals.trackedGrants).toBe(11);
    // Open pipeline = Research, Qualified, Planning, Writing, InternalReview, Submitted, Pending
    // Among tracked: Research(Overdue, Plus31, Null, TieA) = 4 but plus tieA is Research, + Qualified(Today, TieB)=2, Planning(Plus7)=1, Writing(Plus8)=1, InternalReview(Plus30)=1, Submitted(Today)=1, Pending=0 => 4+2+1+1+1+1=10
    // Null deadline still counts for totals/breakdown, Declined etc not present
    expect(dto.totals.openPipeline).toBe(10);

    // Requested sum: 100+200+400+500+600+700 = 2500 plus ties 0, Awarded overdue 0, nulls 0 => total 2500
    // plus other org 7777 must be excluded, soft-deleted 9999 excluded
    // Decimal serialization may be "2500" or "2500.00" depending on Prisma scale — accept either
    expect(Number(dto.totals.requestedTotal)).toBe(2500);
    expect(dto.totals.requestedTotal).toMatch(/^2500(\.0+)?$/);
    // Awarded sum: gOverdue 10 + gPlus7 30 + gPlus30 50 + gPlus31 60 + Awarded Overdue 999 = 1149, gToday null, gPlus8 null
    expect(Number(dto.totals.awardedTotal)).toBe(1149);
    expect(dto.totals.awardedTotal).toMatch(/^1149(\.0+)?$/);

    // Breakdown zero-fills and ordering
    expect(dto.breakdown.map((b) => b.status)).toEqual([
      "Research", "Qualified", "Planning", "Writing", "Internal Review", "Submitted", "Pending", "Awarded", "Declined", "Reporting", "Closed",
    ]);
    // Research: Overdue, Plus31, Null, TieA = 4
    expect(dto.breakdown.find((b) => b.status === "Research")?.count).toBe(4);
    // Qualified: Today + TieB = 2
    expect(dto.breakdown.find((b) => b.status === "Qualified")?.count).toBe(2);
    // Pending etc zero
    expect(dto.breakdown.find((b) => b.status === "Pending")?.count).toBe(0);
    expect(dto.breakdown.find((b) => b.status === "Declined")?.count).toBe(0);
  });

  it("applies exact pre-submission deadline windows with inclusive boundaries", async () => {
    setSession("dash_user_a");
    const dto = await dashboard!.getDashboard({ today: utc("2026-09-04") });

    // Overdue = pre-submission deadline < today: only gOverdue (2026-09-03) qualifies. Awarded Overdue excluded by status, Submitted excluded, Plus31 etc not overdue
    expect(dto.attention.overdueCount).toBe(1);

    // DueIn7 = today <= deadline <= today+7 (2026-09-04 to 2026-09-11 inclusive): gToday (09-04), gPlus7 (09-11), tieA/B (09-05) => 4? Check tieA/B are within 7, gToday yes, gPlus7 yes => 4
    // However tieA/B included? Yes they are pre-submission and deadline 09-05 within window
    expect(dto.attention.dueIn7Count).toBe(4);

    // Upcoming = pre-submission today..+30: gToday, tieA, tieB, gPlus7, gPlus8, gPlus30 => 6 but take 5 nearest ordered deadline asc id asc
    expect(dto.upcoming).toHaveLength(5);
    // Ordering: deadline asc, id asc. So first should be gToday (2026-09-04), then two ties 2026-09-05 sorted by id, then gPlus7 2026-09-11, then gPlus8 2026-09-12, gPlus30 excluded from first 5
    // Verify chronological ordering and tie-breaker directly
    expect(dto.upcoming[0].id).toBe(gTodayId);
    expect(dto.upcoming[0].deadline).toBe("2026-09-04");
    expect(dto.upcoming[1].deadline).toBe("2026-09-05");
    expect(dto.upcoming[2].deadline).toBe("2026-09-05");
    // Tie breaker id asc
    const idsAt0509 = dto.upcoming.slice(1, 3).map((u) => u.id).sort();
    expect(dto.upcoming.slice(1, 3).map((u) => u.id)).toEqual(idsAt0509);
    expect(dto.upcoming[3].id).toBe(gPlus7Id);
    expect(dto.upcoming[3].deadline).toBe("2026-09-11");
    expect(dto.upcoming[4].id).toBe(gPlus8Id);
    expect(dto.upcoming[4].deadline).toBe("2026-09-12");
    // Verify display status mapping
    expect(dto.upcoming.find((u) => u.id === gPlus30Id)).toBeUndefined(); // beyond take 5
    // Ensure null excluded, Submitted not in upcoming, Plus31 outside 30 not included
    expect(dto.upcoming.some((u) => u.id === gPlus31Id)).toBe(false);
    // All upcoming use display status Internal Review not InternalReview
    for (const row of dto.upcoming) {
      expect(row.status).not.toBe("InternalReview");
    }
  });

  it("excludes null deadlines from all deadline-derived sections", async () => {
    setSession("dash_user_a");
    const dto = await dashboard!.getDashboard({ today: utc("2026-09-04") });
    // Null deadline grant should not affect attention or upcoming but does affect totals/breakdown
    expect(dto.attention.overdueCount).toBe(1);
    expect(dto.upcoming.some((u) => u.title === "Null Deadline")).toBe(false);
  });

  it("serializes DTO with YYYY-MM-DD and Decimal strings and keeps cross-org isolated", async () => {
    setSession("dash_user_a");
    const dto = await dashboard!.getDashboard({ today: utc("2026-09-04") });
    expect(dto.asOf).toBe("2026-09-04");
    expect(dto.totals.currency).toBe("USD");
    // JSON serializable
    expect(() => JSON.parse(JSON.stringify(dto))).not.toThrow();
    // Verify other org's data didn't leak by checking counts would be higher if other org included
    // Other org has 1 overdue Research deadline 09-03 — if leaked overdue would be 2
    expect(dto.attention.overdueCount).not.toBe(2);
  });
});
