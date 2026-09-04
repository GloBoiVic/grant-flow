"use server";

import { getClerkSessionState } from "@/lib/clerk/session";
import { prisma } from "@/lib/prisma";
import { createOrganizationSchema } from "@/lib/validation/organization";

export type CreateOrganizationResult =
  | { success: true; status: "created" | "existing"; organizationId: string }
  | { success: false; error: "Unauthorized"; code: "UNAUTHENTICATED" | "MISSING_LOCAL_USER" }
  | { success: false; status: "invalid" | "retryable"; error: string };

export async function createFirstOrganization(input: unknown): Promise<CreateOrganizationResult> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) return { success: false, status: "invalid", error: "Enter a valid organization name." };
  const session = await getClerkSessionState();
  if (!session.authenticated) return { success: false, error: "Unauthorized", code: "UNAUTHENTICATED" };

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: session.userId },
    select: { organizationId: true },
  });
  if (existing) return { success: true, status: "existing", organizationId: existing.organizationId };

  try {
    const user = await prisma.user.create({
      data: {
        clerkUserId: session.userId,
        organization: { create: { name: parsed.data.name } },
      },
      select: { organizationId: true },
    });
    return { success: true, status: "created", organizationId: user.organizationId };
  } catch (error) {
    if (!isClerkUserUniqueConflict(error)) throw error;

    const winner = await prisma.user.findUnique({
      where: { clerkUserId: session.userId },
      select: { organizationId: true },
    });
    if (winner) return { success: true, status: "existing", organizationId: winner.organizationId };
    return { success: false, status: "retryable", error: "Organization setup is still processing. Try again shortly." };
  }
}

function isClerkUserUniqueConflict(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const candidate = error as { code?: unknown; meta?: { target?: unknown } };
  if (candidate.code !== "P2002") return false;
  if (!candidate.meta?.target) return true;
  if (Array.isArray(candidate.meta.target)) {
    return candidate.meta.target.some((field) => field === "clerkUserId" || field === "User_clerkUserId_key");
  }
  return candidate.meta.target === "clerkUserId" || candidate.meta.target === "User_clerkUserId_key";
}
