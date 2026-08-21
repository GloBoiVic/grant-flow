import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDirectory = path.resolve(process.cwd(), "prisma/migrations");

function migrationSql(name: string): string {
  return readFileSync(path.join(migrationsDirectory, name, "migration.sql"), "utf8");
}

describe("fresh migration chain", () => {
  it("creates the onboarding claim before the lease migration alters it", () => {
    const migrations = readdirSync(migrationsDirectory)
      .filter((entry) => entry !== "migration_lock.toml")
      .sort();
    const baseline = "20260810055726_init";
    const leaseMigration = "20260820110000_add_onboarding_create_lease";
    const tagMigration = "20260821120000_add_tag_normalized_name";

    expect(migrations.indexOf(baseline)).toBeGreaterThanOrEqual(0);
    expect(migrations.indexOf(leaseMigration)).toBeGreaterThan(migrations.indexOf(baseline));
    expect(migrations.indexOf(tagMigration)).toBeGreaterThan(migrations.indexOf(leaseMigration));

    const baselineSql = migrationSql(baseline);
    for (const table of ["User", "Organization", "OnboardingClaim"]) {
      expect(baselineSql).toContain(`CREATE TABLE "${table}"`);
    }

    const leaseSql = migrationSql(leaseMigration);
    expect(leaseSql).toContain('ALTER TABLE "OnboardingClaim"');
    expect(leaseSql).toContain('CREATE UNIQUE INDEX "OnboardingClaim_createLeaseToken_key"');

    const tagSql = migrationSql(tagMigration);
    expect(tagSql).toContain('UPDATE "Tag"');
    expect(tagSql).toContain('lower(btrim("name"))');
    expect(tagSql).toContain("Tag normalized-name collision");
    expect(tagSql).toContain('ALTER COLUMN "normalizedName" SET NOT NULL');
    expect(tagSql).toContain('DROP INDEX "Tag_organizationId_name_key"');
    expect(tagSql).toContain('CREATE UNIQUE INDEX "Tag_organizationId_normalizedName_key"');
  });
});
