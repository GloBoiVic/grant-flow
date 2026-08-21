"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { getClerkSessionState } from "@/lib/clerk/session";
import { acquireOnboardingClaim, acquireOnboardingLease, finalizeOnboardingLease, releaseOnboardingLease, renewOnboardingLease } from "@/lib/clerk/onboarding";
import { clerkOrganizationMatchesClaim, recoverOrganizationBySlug, withClerkTimeout } from "@/lib/clerk/onboarding-clerk";

export const createOrganizationSchema = z.object({ name: z.string().trim().min(2).max(120) });
export type CreateOrganizationResult =
  | { success: true; status: "pending"; clerkOrgId: string }
  | { success: false; status: "unauthenticated" | "denied" | "failed" | "invalid" | "retryable" | "error"; error: string };

export async function createFirstOrganization(input: unknown): Promise<CreateOrganizationResult> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) return { success: false, status: "invalid", error: "Enter a valid organization name." };
  const session = await getClerkSessionState();
  if (!session.authenticated) return { success: false, status: "unauthenticated", error: "Sign in to continue." };
  if (session.orgId) return { success: false, status: "denied", error: "Your organization is already active." };

  return createOrganizationForUser(session.userId, parsed.data.name);
}

async function createOrganizationForUser(userId: string, name: string): Promise<CreateOrganizationResult> {
  try {
    const claim = await acquireOnboardingClaim(userId, name);
    if (claim.clerkOrgId) return { success: true, status: "pending", clerkOrgId: claim.clerkOrgId };
    const lease = await acquireOnboardingLease(claim);
    if (lease.status === "already-finalized") return { success: true, status: "pending", clerkOrgId: lease.claim.clerkOrgId as string };
    if (lease.status === "busy") return retryableResult();
    const leaseToken = lease.leaseToken;
    const leasedClaim = lease.claim;
    let finalized = false;
    try {

      const client = await clerkClient();
      let memberships;
      try {
        memberships = await withClerkTimeout(client.users.getOrganizationMembershipList({ userId }));
      } catch {
        return retryableResult();
      }
      if (!Array.isArray(memberships.data)) return retryableResult();
      if (memberships.data.length > 1) return deniedMembershipResult();

      const membership = memberships.data[0];
      const membershipOrganizationId = membership?.organization?.id;
      if (membership && membership.organization?.slug !== claim.slug) return deniedMembershipResult();
      const recovered = await recoverOrganizationBySlug(client, claim);
      if (recovered.status === "transient") return retryableResult();
      if (recovered.status === "found") {
        if (!clerkOrganizationMatchesClaim(recovered.organization, leasedClaim)) return deniedMembershipResult();
        if (membershipOrganizationId && recovered.organization.id !== membershipOrganizationId) return deniedMembershipResult();
        if (!membershipOrganizationId && memberships.data.length > 0) return deniedMembershipResult();
        if (!await finalizeOnboardingLease(leasedClaim.id, leaseToken, recovered.organization.id)) return retryableResult();
        finalized = true;
        return { success: true, status: "pending", clerkOrgId: recovered.organization.id };
      }
      if (memberships.data.length > 0) return deniedMembershipResult();

      if (!await renewOnboardingLease(leasedClaim.id, leaseToken)) return retryableResult();
      let organization;
      try {
        organization = await withClerkTimeout(client.organizations.createOrganization({
          name: claim.name,
          slug: claim.slug,
          createdBy: userId,
          privateMetadata: { grantflowOnboardingClaimId: claim.id, grantflowOnboardingUserId: userId },
        }));
        if (!clerkOrganizationMatchesClaim(organization, leasedClaim)) return deniedMembershipResult();
      } catch {
        const recoveredAfterCreate = await recoverOrganizationBySlug(client, claim);
        if (recoveredAfterCreate.status === "transient") return retryableResult();
        if (recoveredAfterCreate.status === "found" && !clerkOrganizationMatchesClaim(recoveredAfterCreate.organization, leasedClaim)) return deniedMembershipResult();
        if (recoveredAfterCreate.status !== "found") return retryableResult();
        organization = recoveredAfterCreate.organization;
      }
      if (!await finalizeOnboardingLease(leasedClaim.id, leaseToken, organization.id)) return retryableResult();
      finalized = true;
      return { success: true, status: "pending", clerkOrgId: organization.id };
    } catch {
      return retryableResult();
    } finally {
      if (!finalized) await releaseOnboardingLease(leasedClaim.id, leaseToken);
    }
  } catch {
    return retryableResult();
  }
}

function deniedMembershipResult(): Extract<CreateOrganizationResult, { success: false }> {
  return { success: false, status: "denied", error: "An organization membership already exists." };
}

function retryableResult(): Extract<CreateOrganizationResult, { success: false }> {
  return { success: false, status: "retryable", error: "Organization setup is still processing. Try again shortly." };
}
