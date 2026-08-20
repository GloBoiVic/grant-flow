-- Persist an explicit fail-closed diagnostic when Clerk sends an unmapped role.
CREATE TYPE "MembershipRoleSyncStatus" AS ENUM ('KNOWN', 'UNKNOWN');

ALTER TABLE "Membership"
  ALTER COLUMN "role" DROP NOT NULL,
  ADD COLUMN "roleSyncStatus" "MembershipRoleSyncStatus" NOT NULL DEFAULT 'KNOWN',
  ADD COLUMN "clerkRoleUpdatedAt" TIMESTAMPTZ;
