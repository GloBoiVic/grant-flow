"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { getClerkSessionState } from "@/lib/clerk/session";
import { prisma } from "@/lib/prisma";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required").max(120),
});

export type CreateOrganizationResult =
  | { success: true; status: "pending"; clerkOrgId: string }
  | { success: false; status: "unauthenticated" | "denied" | "pending" | "failed" | "invalid" | "error"; error: string };

export async function createFirstOrganization(
  input: unknown,
): Promise<CreateOrganizationResult> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, status: "invalid", error: "Enter a valid organization name." };
  }

  const session = await getClerkSessionState();
  if (!session.authenticated) {
    return { success: false, status: "unauthenticated", error: "Sign in to continue." };
  }
  if (session.orgId) {
    return { success: false, status: "denied", error: "Your organization is already active." };
  }

  const claim = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { clerkUserId: session.userId },
      select: {
        id: true,
        clerkDeletedAt: true,
        tenantIsolationLockedAt: true,
        membership: { select: { id: true } },
        organizationProvisioning: { select: { id: true, status: true, clerkOrgId: true } },
      },
    });
    if (!user || user.clerkDeletedAt || user.tenantIsolationLockedAt || user.membership) return null;
    if (user.organizationProvisioning) {
      if (user.organizationProvisioning.status !== "PRE_BINDING") {
        return { userId: user.id, isNew: false, ...user.organizationProvisioning };
      }
      const claimed = await tx.organizationProvisioning.updateMany({
        where: { userId: user.id, status: "PRE_BINDING", clerkOrgId: null },
        data: { status: "PENDING" },
      });
      return {
        userId: user.id,
        id: user.organizationProvisioning.id,
        isNew: claimed.count === 1,
        status: "PENDING" as const,
        clerkOrgId: null,
      };
    }
    return null;
  });

  if (!claim) return { success: false, status: "denied", error: "Organization access is unavailable." };
  if (claim.status === "COMPLETED" && claim.clerkOrgId) {
    return { success: true, status: "pending", clerkOrgId: claim.clerkOrgId };
  }
  if (claim.status === "FAILED") {
    return { success: false, status: "failed", error: "Organization setup could not be completed." };
  }
  if (!claim.isNew) {
    return { success: false, status: "pending", error: "Organization setup is already in progress." };
  }
  if (claim.clerkOrgId) {
    return { success: true, status: "pending", clerkOrgId: claim.clerkOrgId };
  }

  try {
    const organization = await (await clerkClient()).organizations.createOrganization({
      name: parsed.data.name,
      createdBy: session.userId,
      privateMetadata: { grantflowOnboardingClaimId: claim.id },
    });
    await prisma.organizationProvisioning.updateMany({
      where: { userId: claim.userId, status: "PENDING", clerkOrgId: null },
      data: { clerkOrgId: organization.id },
    });
    return { success: true, status: "pending", clerkOrgId: organization.id };
  } catch {
    // The Clerk response is ambiguous: the organization may have been created
    // even though this request failed. Keep the durable claim PENDING so later
    // correlated Clerk webhooks can complete the binding.
    return { success: false, status: "error", error: "Organization setup could not be started. Try again later." };
  }
}
