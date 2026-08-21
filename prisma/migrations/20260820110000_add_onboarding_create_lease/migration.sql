ALTER TABLE "OnboardingClaim"
  ADD COLUMN "createLeaseToken" TEXT,
  ADD COLUMN "createLeaseExpiresAt" TIMESTAMPTZ;

CREATE UNIQUE INDEX "OnboardingClaim_createLeaseToken_key"
  ON "OnboardingClaim"("createLeaseToken");
