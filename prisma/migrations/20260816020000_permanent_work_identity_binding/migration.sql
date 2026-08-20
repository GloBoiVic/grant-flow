-- UNAPPLIED ARTIFACT: generated with `prisma migrate diff` only.
-- This migration must be reviewed and applied separately; this task does not
-- connect to or modify any database.

-- CreateEnum
CREATE TYPE "OrganizationProvisioningStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "Membership_organizationId_userId_key";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "creatorId" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clerkDeletedAt" TIMESTAMPTZ,
ADD COLUMN     "tenantIsolationLockedAt" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "clerkDeletedAt" TIMESTAMPTZ,
ALTER COLUMN "clerkMembershipId" SET NOT NULL;

-- CreateTable
CREATE TABLE "OrganizationProvisioning" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "OrganizationProvisioningStatus" NOT NULL,
    "clerkOrgId" TEXT,
    "failureCode" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "OrganizationProvisioning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProvisioning_userId_key" ON "OrganizationProvisioning"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProvisioning_clerkOrgId_key" ON "OrganizationProvisioning"("clerkOrgId");

-- CreateIndex
CREATE INDEX "Organization_creatorId_idx" ON "Organization"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationProvisioning" ADD CONSTRAINT "OrganizationProvisioning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
