import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";

const enabled = Boolean(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL);
const describePostgres = describe.skipIf(!enabled);
const root = process.cwd();
const migrations = path.join(root, "prisma", "migrations");
const baseline = "20260810055726_init";
const lease = "20260820110000_add_onboarding_create_lease";
const tagMigration = "20260821120000_add_tag_normalized_name";
const databases: { name: string; admin: Pool; pool: Pool }[] = [];

function dbName() { return `grantflow_tag_migration_${randomUUID().replaceAll("-", "")}`; }
function dbUrl(url: string, name: string) { const parsed = new URL(url); if (!parsed.username && process.env.USER) parsed.username = process.env.USER; parsed.pathname = `/${name}`; return parsed.toString(); }

async function migrationSql(name: string) { return readFile(path.join(migrations, name, "migration.sql"), "utf8"); }
async function createDatabase() {
  const admin = new Pool({ connectionString: process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL }); const name = dbName(); await admin.query(`CREATE DATABASE "${name}"`); const url = dbUrl(process.env.GRANTFLOW_TEST_DATABASE_ADMIN_URL as string, name); const pool = new Pool({ connectionString: url }); databases.push({ name, admin, pool }); return { name, admin, pool, url };
}
async function oldTagFixture(pool: Pool, collision: boolean) {
  const org = randomUUID(), other = randomUUID(), tag1 = randomUUID(), tag2 = randomUUID(), grant = randomUUID(), funder = randomUUID(), user = randomUUID();
  await pool.query(`INSERT INTO "Organization" ("id","clerkOrgId","name","slug","updatedAt") VALUES ($1,'old-org','Old Org','old-org',now()),($2,'other-org','Other Org','other-org',now())`, [org, other]);
  await pool.query(`INSERT INTO "User" ("id","clerkUserId","email","name","updatedAt") VALUES ($1,'old-user',$2,'Old User',now())`, [user, `${randomUUID()}@example.com`]);
  await pool.query(`INSERT INTO "Funder" ("id","organizationId","name","type","updatedAt") VALUES ($1,$2,'Old Funder','FOUNDATION',now())`, [funder, org]);
  await pool.query(`INSERT INTO "Tag" ("id","organizationId","name") VALUES ($1,$3,' Housing '),($2,$3,$4)`, [tag1, tag2, org, collision ? "housing" : "Education"]);
  await pool.query(`INSERT INTO "Grant" ("id","organizationId","funderId","title","status","createdById","updatedAt") VALUES ($1,$2,$3,'Old Grant','Research',$4,now())`, [grant, org, funder, user]);
  if (collision) await pool.query(`INSERT INTO "GrantTag" ("grantId","tagId") VALUES ($1,$2),($1,$3)`, [grant, tag1, tag2]);
  return { org, tag1, tag2, grant };
}

describePostgres("tag migration safety", () => {
  afterAll(async () => { for (const entry of databases) { await entry.pool.end(); try { await entry.admin.query(`DROP DATABASE IF EXISTS "${entry.name}"`); } finally { await entry.admin.end(); } } }, 120_000);

  it("deploys fresh and backfills a non-conflicting upgrade", async () => {
    const database = await createDatabase();
    await database.pool.query(await migrationSql(baseline));
    await database.pool.query(await migrationSql(lease));
    const seeded = await oldTagFixture(database.pool, false);
    await database.pool.query(await migrationSql(tagMigration));
    const rows = await database.pool.query(`SELECT "normalizedName" FROM "Tag" WHERE "id" IN ($1,$2) ORDER BY "normalizedName"`, [seeded.tag1, seeded.tag2]);
    expect(rows.rows.map((row) => row.normalizedName)).toEqual(["education", "housing"]);
  }, 120_000);

  it("refuses normalized collisions without rewriting tag history", async () => {
    const database = await createDatabase();
    await database.pool.query(await migrationSql(baseline));
    await database.pool.query(await migrationSql(lease));
    const seeded = await oldTagFixture(database.pool, true);
    await expect(database.pool.query(await migrationSql(tagMigration))).rejects.toThrow(/Tag normalized-name collision/);
    const rows = await database.pool.query(`SELECT "name" FROM "Tag" WHERE "id" IN ($1,$2) ORDER BY "id"`, [seeded.tag1, seeded.tag2]);
    expect(rows.rows.map((row) => row.name).sort()).toEqual([" Housing ", "housing"].sort());
    const joins = await database.pool.query(`SELECT count(*)::int AS count FROM "GrantTag" WHERE "grantId" = $1`, [seeded.grant]);
    expect(joins.rows[0].count).toBe(2);
  }, 120_000);
});
