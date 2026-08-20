import "server-only";

import { prisma } from "@/lib/prisma";
import type { MembershipRole } from "@/lib/clerk/roles";

export type IdentityProjection = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

export type ProjectionResolution =
  | { status: "ready"; projection: IdentityProjection }
  | { status: "missing-user" }
  | { status: "missing-organization" }
  | { status: "missing-membership" }
  | { status: "unknown-role" }
  | { status: "revoked" }
  | { status: "tenant-isolation-locked" };

export type OnboardingResolution = "eligible" | "denied" | "revoked" | "tenant-isolation-locked";

export async function resolveOnboardingEligibility(clerkUserId: string): Promise<OnboardingResolution> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      clerkDeletedAt: true,
      tenantIsolationLockedAt: true,
      membership: { select: { id: true } },
      organizationProvisioning: { select: { status: true } },
    },
  });
  if (!user) return "denied";
  if (user.tenantIsolationLockedAt) return "tenant-isolation-locked";
  if (user.clerkDeletedAt) return "revoked";
  if (user.membership) return "denied";
  return user.organizationProvisioning?.status === "PENDING" ? "eligible" : "denied";
}

export async function findIdentityProjection(
  clerkUserId: string,
  clerkOrgId: string,
): Promise<IdentityProjection | null> {
  const result = await resolveIdentityProjection(clerkUserId, clerkOrgId);
  return result.status === "ready" ? result.projection : null;
}

/** Resolves webhook-maintained records without treating infrastructure errors as absence. */
export async function resolveIdentityProjection(
  clerkUserId: string,
  clerkOrgId: string,
): Promise<ProjectionResolution> {
  const [user, organization] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, clerkDeletedAt: true, tenantIsolationLockedAt: true },
    }),
    prisma.organization.findUnique({
      where: { clerkOrgId },
      select: { id: true },
    }),
  ]);

  if (!user) return { status: "missing-user" };
  if (user.tenantIsolationLockedAt) return { status: "tenant-isolation-locked" };
  if (user.clerkDeletedAt) return { status: "revoked" };
  if (!organization) return { status: "missing-organization" };

  const membership = await prisma.membership.findUnique({
    where: { userId: user.id },
    select: { role: true, roleSyncStatus: true, organizationId: true, clerkMembershipId: true, clerkDeletedAt: true },
  });

  if (!membership || membership.organizationId !== organization.id || membership.clerkDeletedAt) {
    return membership?.clerkDeletedAt ? { status: "revoked" } : { status: "missing-membership" };
  }
  if (!membership.clerkMembershipId) return { status: "missing-membership" };
  if (membership.roleSyncStatus === "UNKNOWN" || !membership.role) return { status: "unknown-role" };
  return {
    status: "ready",
    projection: {
      userId: user.id,
      organizationId: organization.id,
      role: membership.role,
    },
  };
}
