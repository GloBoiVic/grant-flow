import "server-only";

import { redirect } from "next/navigation";

import { getClerkSessionState } from "@/lib/clerk/session";
import { prisma } from "@/lib/prisma";

export type AuthorizationContext = {
  clerkUserId: string;
  organizationId: string;
  userId: string;
};

export type AuthorizationFailureCode = "UNAUTHENTICATED" | "MISSING_LOCAL_USER";

export class AuthorizationError extends Error {
  constructor(readonly code: AuthorizationFailureCode) {
    super("Unauthorized");
    this.name = "AuthorizationError";
  }
}

export type AuthorizationResolution =
  | { status: "authenticated"; context: AuthorizationContext }
  | { status: "unauthenticated" | "missing-local-user" };

export async function resolveAuthorization(): Promise<AuthorizationResolution> {
  const session = await getClerkSessionState();
  if (!session.authenticated) return { status: "unauthenticated" };
  const user = await prisma.user.findUnique({
    where: { clerkUserId: session.userId },
    select: { id: true, organizationId: true },
  });
  if (!user) return { status: "missing-local-user" };
  return { status: "authenticated", context: { clerkUserId: session.userId, userId: user.id, organizationId: user.organizationId } };
}

const failureCodes: Record<Exclude<AuthorizationResolution["status"], "authenticated">, AuthorizationFailureCode> = {
  unauthenticated: "UNAUTHENTICATED",
  "missing-local-user": "MISSING_LOCAL_USER",
};

export async function requireAuthorization(): Promise<AuthorizationContext> {
  const result = await resolveAuthorization();
  if (result.status === "authenticated") return result.context;
  throw new AuthorizationError(failureCodes[result.status]);
}

export async function requireAuthorizationOrRedirect(): Promise<AuthorizationContext> {
  try {
    return await requireAuthorization();
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
    if (error.code === "UNAUTHENTICATED") redirect("/login");
    redirect("/organization");
  }
}

export type AuthorizationFailure = { success: false; error: "Unauthorized"; code: AuthorizationFailureCode };

export async function authorizeAction(): Promise<AuthorizationContext | AuthorizationFailure> {
  try {
    return await requireAuthorization();
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, error: "Unauthorized", code: error.code };
    throw error;
  }
}
