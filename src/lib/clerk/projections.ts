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
  | { status: "missing-membership" };

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
      select: { id: true },
    }),
    prisma.organization.findUnique({
      where: { clerkOrgId },
      select: { id: true },
    }),
  ]);

  if (!user) return { status: "missing-user" };
  if (!organization) return { status: "missing-organization" };

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    select: { role: true },
  });

  if (!membership) return { status: "missing-membership" };
  return {
    status: "ready",
    projection: {
      userId: user.id,
      organizationId: organization.id,
      role: membership.role,
    },
  };
}
