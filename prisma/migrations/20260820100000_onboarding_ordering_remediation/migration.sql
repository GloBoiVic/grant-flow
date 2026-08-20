-- PRE_BINDING is created with a local User projection before onboarding can
-- begin. This is an unapplied successor artifact; apply only through the
-- approved migration workflow.
ALTER TYPE "OrganizationProvisioningStatus" ADD VALUE 'PRE_BINDING';

CREATE TABLE "UserDeletionFence" (
    "id" UUID NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "UserDeletionFence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserDeletionFence_clerkUserId_key" ON "UserDeletionFence"("clerkUserId");
