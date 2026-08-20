import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrations = join(root, "prisma/migrations");
const target = join(migrations, "20260816020000_permanent_work_identity_binding", "migration.sql");

describe("permanent work-identity migration history", () => {
  it("retains only the committed foundation migrations plus the unapplied target", () => {
    expect(readdirSync(migrations).filter((name) => name !== "migration_lock.toml").sort()).toEqual([
      "20260810055726_init",
      "20260813000000_add_membership_clerk_membership_id",
      "20260816020000_permanent_work_identity_binding",
      "20260820090000_fail_closed_unknown_membership_role",
    ]);
  });

  it("marks the generated target unapplied and encodes the permanent binding", () => {
    expect(existsSync(target)).toBe(true);
    const sql = readFileSync(target, "utf8");
    expect(sql).toContain("UNAPPLIED ARTIFACT");
    expect(sql).toContain('CREATE UNIQUE INDEX "Membership_userId_key"');
    expect(sql).toContain('ADD COLUMN     "tenantIsolationLockedAt" TIMESTAMPTZ');
    expect(sql).toContain('ADD COLUMN     "clerkDeletedAt" TIMESTAMPTZ');
    expect(sql).not.toContain("activeMembershipId");
    expect(sql).toContain('DROP INDEX "Membership_organizationId_userId_key"');
  });

  it("keeps the permanent-binding artifact byte-for-byte stable", () => {
    const sql = readFileSync(target);
    expect(createHash("sha256").update(sql).digest("hex")).toBe("281a9c4f26f312eff5c3289ea4429f090f42fea03eb7efa3e76a5bd91bebbb56");
  });

  it("does not retain rejected historical/rejoin artifacts", () => {
    for (const name of [
      "20260815214117_add_single_org_projections",
      "20260816000000_expand_historical_memberships",
      "20260816010000_allow_historical_membership_rejoins",
    ]) {
      expect(existsSync(join(migrations, name))).toBe(false);
    }
  });
});
