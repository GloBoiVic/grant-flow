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

    expect(migrations.indexOf(baseline)).toBeGreaterThanOrEqual(0);
    expect(migrations.indexOf(leaseMigration)).toBeGreaterThan(migrations.indexOf(baseline));

    const baselineSql = migrationSql(baseline);
    for (const table of ["User", "Organization", "OnboardingClaim"]) {
      expect(baselineSql).toContain(`CREATE TABLE "${table}"`);
    }

    const leaseSql = migrationSql(leaseMigration);
    expect(leaseSql).toContain('ALTER TABLE "OnboardingClaim"');
    expect(leaseSql).toContain('CREATE UNIQUE INDEX "OnboardingClaim_createLeaseToken_key"');
  });
});
