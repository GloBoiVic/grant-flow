ALTER TABLE "Membership" ADD COLUMN "clerkMembershipId" TEXT;

CREATE UNIQUE INDEX "Membership_clerkMembershipId_key" ON "Membership"("clerkMembershipId");
