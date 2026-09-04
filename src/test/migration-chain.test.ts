import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDirectory = path.resolve(process.cwd(), "prisma/migrations");
const baseline = "20260904000000_local_tenancy_baseline";

describe("local tenancy migration baseline", () => {
  it("contains one clean migration with the final schema", () => {
    const migrations = readdirSync(migrationsDirectory)
      .filter((entry) => entry !== "migration_lock.toml")
      .sort();
    expect(migrations).toEqual([baseline]);

    const sql = readFileSync(path.join(migrationsDirectory, baseline, "migration.sql"), "utf8");
    expect(sql).toContain('CREATE TABLE "Organization"');
    expect(sql).toContain('CREATE TABLE "User"');
    expect(sql).toContain('"organizationId" UUID NOT NULL');
    expect(sql).toContain('CREATE UNIQUE INDEX "User_clerkUserId_key"');
    expect(sql).toContain('CREATE UNIQUE INDEX "Tag_organizationId_normalizedName_key"');
    expect(sql).toContain('ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"');
    expect(sql).not.toMatch(/clerkOrgId|"slug"|OnboardingClaim|createLease|avatarUrl/);
  });
});
