import "server-only";

import { prisma } from "@/lib/prisma";

export type IdentityProjection = {
  userId: string;
  organizationId: string;
};

export type ProjectionResolution =
  | { status: "ready"; projection: IdentityProjection }
  | { status: "missing-user" }
  | { status: "missing-organization" };

export async function resolveIdentityProjection(
  clerkUserId: string,
  clerkOrgId: string,
): Promise<ProjectionResolution> {
  const [user, organization] = await Promise.all([
    prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } }),
    prisma.organization.findUnique({ where: { clerkOrgId }, select: { id: true } }),
  ]);
  if (!user) return { status: "missing-user" };
  if (!organization) return { status: "missing-organization" };
  return { status: "ready", projection: { userId: user.id, organizationId: organization.id } };
}
