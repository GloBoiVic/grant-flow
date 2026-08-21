import "server-only";

import { redirect } from "next/navigation";

import { resolveIdentityProjection } from "@/lib/clerk/projections";
import { getClerkSessionState } from "@/lib/clerk/session";
import { isRecognizedClerkRole, isRoleAtLeast, type ClerkRole } from "@/lib/clerk/roles";

export type AuthorizationContext = {
  clerkUserId: string;
  clerkOrgId: string;
  organizationId: string;
  userId: string;
  role: ClerkRole;
};

export type AuthorizationFailureCode = "UNAUTHENTICATED" | "NO_ACTIVE_ORGANIZATION" | "PROJECTION_MISSING" | "ROLE_MISMATCH" | "INSUFFICIENT_ROLE";

export class AuthorizationError extends Error {
  constructor(readonly code: AuthorizationFailureCode) {
    super("Unauthorized");
    this.name = "AuthorizationError";
  }
}

export type AuthorizationResolution =
  | { status: "authenticated"; context: AuthorizationContext }
  | { status: "unauthenticated" | "no-active-organization" | "projection-pending" | "role-mismatch" | "insufficient-role" };

export async function resolveAuthorization(minimumRole?: ClerkRole): Promise<AuthorizationResolution> {
  const session = await getClerkSessionState();
  if (!session.authenticated) return { status: "unauthenticated" };
  if (!session.orgId) return { status: "no-active-organization" };
  if (!isRecognizedClerkRole(session.orgRole)) return { status: "role-mismatch" };
  if (minimumRole && !isRecognizedClerkRole(minimumRole)) return { status: "role-mismatch" };
  const projection = await resolveIdentityProjection(session.userId, session.orgId);
  if (projection.status !== "ready") return { status: "projection-pending" };
  if (minimumRole && !isRoleAtLeast(session.orgRole, minimumRole)) return { status: "insufficient-role" };
  return { status: "authenticated", context: { clerkUserId: session.userId, clerkOrgId: session.orgId, userId: projection.projection.userId, organizationId: projection.projection.organizationId, role: session.orgRole } };
}

const failureCodes: Record<Exclude<AuthorizationResolution["status"], "authenticated">, AuthorizationFailureCode> = {
  unauthenticated: "UNAUTHENTICATED",
  "no-active-organization": "NO_ACTIVE_ORGANIZATION",
  "projection-pending": "PROJECTION_MISSING",
  "role-mismatch": "ROLE_MISMATCH",
  "insufficient-role": "INSUFFICIENT_ROLE",
};

export async function requireAuthorization(minimumRole?: ClerkRole): Promise<AuthorizationContext> {
  const result = await resolveAuthorization(minimumRole);
  if (result.status === "authenticated") return result.context;
  throw new AuthorizationError(failureCodes[result.status]);
}

export async function requireAuthorizationOrRedirect(minimumRole?: ClerkRole): Promise<AuthorizationContext> {
  try {
    return await requireAuthorization(minimumRole);
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
    if (error.code === "UNAUTHENTICATED") redirect("/login");
    if (error.code === "NO_ACTIVE_ORGANIZATION") redirect("/organization");
    redirect("/access");
  }
}

export type AuthorizationFailure = { success: false; error: "Unauthorized"; code: AuthorizationFailureCode };

export async function authorizeAction(minimumRole?: ClerkRole): Promise<AuthorizationContext | AuthorizationFailure> {
  try {
    return await requireAuthorization(minimumRole);
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, error: "Unauthorized", code: error.code };
    throw error;
  }
}
