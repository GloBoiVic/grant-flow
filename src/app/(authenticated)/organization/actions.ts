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
        organizationProvisioning: { select: { status: true, clerkOrgId: true } },
      },
    });
    if (!user || user.clerkDeletedAt || user.tenantIsolationLockedAt || user.membership) return null;
    if (user.organizationProvisioning) return { userId: user.id, isNew: false, ...user.organizationProvisioning };

    const created = await tx.organizationProvisioning.create({
      data: { userId: user.id, status: "PENDING" },
      select: { status: true, clerkOrgId: true },
    });
    return { userId: user.id, isNew: true, ...created };
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
    });
    await prisma.organizationProvisioning.updateMany({
      where: { userId: claim.userId, status: "PENDING", clerkOrgId: null },
      data: { clerkOrgId: organization.id },
    });
    return { success: true, status: "pending", clerkOrgId: organization.id };
  } catch {
    await prisma.organizationProvisioning.updateMany({
      where: { userId: claim.userId, status: "PENDING" },
      data: { status: "FAILED", failureCode: "CLERK_CREATE_FAILED" },
    });
    return { success: false, status: "error", error: "Organization setup could not be started. Try again later." };
  }
}
