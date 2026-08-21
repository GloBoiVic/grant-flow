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

const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const describePostgres = describe.skipIf(!enabled);
const execFileAsync = promisify(execFile);
const timeout = 120_000;

let admin: Pool | undefined;
let db: PrismaClient | undefined;
let appPrisma: typeof import("@/lib/prisma").prisma | undefined;
let testDatabaseName = "";
let orgA = "";
let orgB = "";
let grantA = "";
let grantB = "";
let tagA = "";
let tagB = "";
let softTag = "";
let softGrant = "";

function databaseName() { return `grantflow_tag_test_${randomUUID().replaceAll("-", "")}`; }
function withDatabase(url: string, name: string) {
  const parsed = new URL(url);
  if (!parsed.username && process.env.USER) parsed.username = process.env.USER;
  parsed.pathname = `/${name}`;
  return parsed.toString();
}
function session(orgId: string, role: string = "org:member") {
  authMock.mockResolvedValue({ userId: "clerk-user", orgId: orgId === orgA ? "org_tag_a" : orgId === orgB ? "org_tag_b" : orgId, orgRole: role });
}

async function seed(client: PrismaClient) {
  const [a, b] = await Promise.all([
    client.organization.create({ data: { clerkOrgId: "org_tag_a", name: "Tag A", slug: `tag-a-${randomUUID()}` } }),
    client.organization.create({ data: { clerkOrgId: "org_tag_b", name: "Tag B", slug: `tag-b-${randomUUID()}` } }),
  ]);
  orgA = a.id; orgB = b.id;
  const user = await client.user.create({ data: { clerkUserId: "clerk-user", email: `${randomUUID()}@example.com`, name: "Tag Tester" } });
  const [funderA, funderB] = await Promise.all([
    client.funder.create({ data: { organizationId: orgA, name: "Funder A", type: "FOUNDATION" } }),
    client.funder.create({ data: { organizationId: orgB, name: "Funder B", type: "FOUNDATION" } }),
  ]);
  const [aGrant, bGrant, deleted] = await Promise.all([
    client.grant.create({ data: { organizationId: orgA, funderId: funderA.id, title: "Grant A", status: "Research", createdById: user.id } }),
    client.grant.create({ data: { organizationId: orgB, funderId: funderB.id, title: "Grant B", status: "Research", createdById: user.id } }),
    client.grant.create({ data: { organizationId: orgA, funderId: funderA.id, title: "Deleted Grant", status: "Research", createdById: user.id, deletedAt: new Date() } }),
  ]);
  grantA = aGrant.id; grantB = bGrant.id; softGrant = deleted.id;
  const [aTag, bTag, deletedTag] = await Promise.all([
    client.tag.create({ data: { organizationId: orgA, name: "Program", normalizedName: "program" } }),
    client.tag.create({ data: { organizationId: orgB, name: "Program", normalizedName: "program" } }),
    client.tag.create({ data: { organizationId: orgA, name: "Archived", normalizedName: "archived", deletedAt: new Date() } }),
  ]);
  tagA = aTag.id; tagB = bTag.id; softTag = deletedTag.id;
  await client.grantTag.createMany({ data: [{ grantId: grantA, tagId: tagA }, { grantId: grantA, tagId: softTag }, { grantId: grantA, tagId: tagB }, { grantId: softGrant, tagId: tagA }] });
}

describePostgres("tag database acceptance", () => {
  let tags: typeof import("@/lib/queries/tags");
  let grants: typeof import("@/lib/queries/grants");
  let actions: typeof import("@/app/(authenticated)/(org-required)/grants/tag-actions");

  async function cleanup() {
    const errors: unknown[] = [];
    for (const client of [appPrisma, db]) if (client) { try { await client.$disconnect(); } catch (e) { errors.push(e); } }
    appPrisma = undefined; db = undefined;
    if (admin && testDatabaseName) { try { await admin.query(`DROP DATABASE IF EXISTS "${testDatabaseName}"`); } catch (e) { errors.push(e); } }
    if (admin) { try { await admin.end(); } catch (e) { errors.push(e); } }
    admin = undefined;
    if (errors.length) throw new AggregateError(errors, "tag integration cleanup failed");
  }

  beforeAll(async () => {
    const adminUrl = process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL as string;
    testDatabaseName = databaseName(); admin = new Pool({ connectionString: adminUrl });
    const databaseUrl = withDatabase(adminUrl, testDatabaseName);
    try {
      await admin.query(`CREATE DATABASE "${testDatabaseName}"`);
      await execFileAsync("npx", ["prisma", "migrate", "deploy"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl }, timeout });
      process.env.DATABASE_URL = databaseUrl;
      db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
      await seed(db);
      appPrisma = (await import("@/lib/prisma")).prisma;
      tags = await import("@/lib/queries/tags"); grants = await import("@/lib/queries/grants");
      actions = await import("@/app/(authenticated)/(org-required)/grants/tag-actions");
    } catch (error) { try { await cleanup(); } catch (cleanupError) { throw new AggregateError([error, cleanupError]); } throw error; }
  }, timeout);
  afterAll(cleanup, timeout);
  beforeEach(() => authMock.mockReset());

  it("converges concurrent case-equivalent creates and permits the same name in another org", async () => {
    session(orgA);
    const results = await Promise.all([actions.createTag({ name: " Housing " }), actions.createTag({ name: "housing" })]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(results.filter((result) => !result.success)).toHaveLength(1);
    expect(await db!.tag.count({ where: { organizationId: orgA, normalizedName: "housing" } })).toBe(1);
    session(orgB);
    expect((await actions.createTag({ name: "Housing" })).success).toBe(true);
  });

  it("hides tenant, soft-deleted, and malformed join tags from lists and DTOs", async () => {
    session(orgA);
    const listed = await tags.listTags();
    expect(listed.items.map((tag) => tag.id)).toContain(tagA);
    expect(listed.items.map((tag) => tag.id)).not.toContain(tagB);
    expect(listed.items.map((tag) => tag.id)).not.toContain(softTag);
    const result = await grants.listGrants();
    const row = result.items.find((grant) => grant.id === grantA);
    expect(row?.tags.map((tag) => tag.id)).toEqual([tagA]);
    expect(result.items.map((grant) => grant.id)).not.toContain(softGrant);
    expect(JSON.stringify(row)).not.toContain(softTag);
  });

  it("denies cross-org and soft-deleted assignment/removal without writes", async () => {
    session(orgA);
    const before = await db!.grantTag.count();
    for (const input of [{ grantId: grantB, tagId: tagA }, { grantId: grantA, tagId: tagB }, { grantId: grantA, tagId: softTag }, { grantId: softGrant, tagId: tagA }]) {
      expect(await actions.assignTagToGrant(input)).toEqual({ success: false, error: "Grant or tag not found." });
      expect(await actions.removeTagFromGrant(input)).toEqual({ success: false, error: "Grant or tag not found." });
    }
    expect(await db!.grantTag.count()).toBe(before);
  });

  it("gives member and admin parity, with idempotent relation operations and no Activity", async () => {
    session(orgA, "org:member");
    const created = await actions.createTag({ name: "Member Tag" });
    expect(created.success).toBe(true); if (!created.success) return;
    const beforeActivity = await db!.activity.count();
    expect((await actions.assignTagToGrant({ grantId: grantA, tagId: created.data.id })).success).toBe(true);
    expect((await actions.assignTagToGrant({ grantId: grantA, tagId: created.data.id })).success).toBe(true);
    expect(await db!.grantTag.count({ where: { grantId: grantA, tagId: created.data.id } })).toBe(1);
    session(orgA, "org:admin");
    expect((await actions.removeTagFromGrant({ grantId: grantA, tagId: created.data.id })).success).toBe(true);
    expect((await actions.removeTagFromGrant({ grantId: grantA, tagId: created.data.id })).success).toBe(true);
    expect(await db!.grantTag.count({ where: { grantId: grantA, tagId: created.data.id } })).toBe(0);
    expect(await db!.activity.count()).toBe(beforeActivity);
  });

  it("rejects unrecognized roles before changing tags or joins", async () => {
    session(orgA, "org:viewer");
    const before = await db!.tag.count();
    expect((await actions.createTag({ name: "Viewer Tag" })).success).toBe(false);
    expect((await actions.assignTagToGrant({ grantId: grantA, tagId: tagA })).success).toBe(false);
    expect(await db!.tag.count()).toBe(before);
  });
});
