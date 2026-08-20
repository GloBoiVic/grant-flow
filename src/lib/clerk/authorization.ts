import "server-only";

import { redirect } from "next/navigation";

import { mapClerkRole, isRoleAtLeast } from "@/lib/clerk/roles";
import { getClerkSessionState } from "@/lib/clerk/session";
import { resolveIdentityProjection, resolveOnboardingEligibility } from "@/lib/clerk/projections";
import type { MembershipRole } from "@/lib/clerk/roles";

export type AuthorizationContext = {
  clerkUserId: string;
  clerkOrgId: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

export type AuthorizationFailureCode =
  | "UNAUTHENTICATED"
  | "NO_ACTIVE_ORGANIZATION"
  | "PROJECTION_MISSING"
  | "PERMANENTLY_REVOKED"
  | "TENANT_ISOLATION_LOCKED"
  | "ROLE_MISMATCH"
  | "INSUFFICIENT_ROLE";

export class AuthorizationError extends Error {
  readonly code: AuthorizationFailureCode;

  constructor(code: AuthorizationFailureCode) {
    super("Unauthorized");
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export type AuthorizationResolution =
  | { status: "authenticated"; context: AuthorizationContext }
  | { status: "unauthenticated" }
  | { status: "no-active-organization" }
  | { status: "onboarding-eligible" }
  | { status: "onboarding-denied" }
  | { status: "projection-pending" }
  | { status: "permanently-revoked" }
  | { status: "tenant-isolation-locked" }
  | { status: "role-mismatch" }
  | { status: "insufficient-role" };

/** Read-only auth state resolver. Database/infrastructure failures are deliberately not caught. */
export async function resolveAuthorization(
  minimumRole?: MembershipRole,
): Promise<AuthorizationResolution> {
  const session = await getClerkSessionState();
  if (!session.authenticated) return { status: "unauthenticated" };
  if (!session.orgId) {
    const onboarding = await resolveOnboardingEligibility(session.userId);
    if (onboarding === "eligible") return { status: "onboarding-eligible" };
    if (onboarding === "revoked") return { status: "permanently-revoked" };
    if (onboarding === "tenant-isolation-locked") return { status: "tenant-isolation-locked" };
    return { status: "onboarding-denied" };
  }

  const projection = await resolveIdentityProjection(session.userId, session.orgId);
  if (projection.status === "revoked") return { status: "permanently-revoked" };
  if (projection.status === "tenant-isolation-locked") return { status: "tenant-isolation-locked" };
  if (projection.status === "unknown-role") return { status: "role-mismatch" };
  if (projection.status !== "ready") return { status: "projection-pending" };

  const clerkRole = mapClerkRole(session.orgRole);
  if (clerkRole === null || clerkRole !== projection.projection.role) return { status: "role-mismatch" };
  if (minimumRole && !isRoleAtLeast(projection.projection.role, minimumRole)) {
    return { status: "insufficient-role" };
  }

  return {
    status: "authenticated",
    context: {
      clerkUserId: session.userId,
      clerkOrgId: session.orgId,
      userId: projection.projection.userId,
      organizationId: projection.projection.organizationId,
      role: projection.projection.role,
    },
  };
}

/** Expected Server Action authorization result; feature actions can return this unchanged. */
export type AuthorizationFailure = {
  success: false;
  error: "Unauthorized";
  code: AuthorizationFailureCode;
};

export function authorizationFailure(
  error: AuthorizationError,
): AuthorizationFailure {
  return { success: false, error: "Unauthorized", code: error.code };
}

/** The sole successful authorization shape. Scope is always derived from auth(). */
export async function requireAuthorization(
  minimumRole?: MembershipRole,
): Promise<AuthorizationContext> {
  const result = await resolveAuthorization(minimumRole);
  if (result.status === "authenticated") return result.context;
  const codeByStatus = {
    unauthenticated: "UNAUTHENTICATED",
    "no-active-organization": "NO_ACTIVE_ORGANIZATION",
    "onboarding-eligible": "NO_ACTIVE_ORGANIZATION",
    "onboarding-denied": "PROJECTION_MISSING",
    "projection-pending": "PROJECTION_MISSING",
    "permanently-revoked": "PERMANENTLY_REVOKED",
    "tenant-isolation-locked": "TENANT_ISOLATION_LOCKED",
    "role-mismatch": "ROLE_MISMATCH",
    "insufficient-role": "INSUFFICIENT_ROLE",
  } as const;
  throw new AuthorizationError(codeByStatus[result.status]);
}

/** Server Component boundary: redirect without exposing authorization details. */
export async function requireAuthorizationOrRedirect(
  minimumRole?: MembershipRole,
): Promise<AuthorizationContext> {
  try {
    return await requireAuthorization(minimumRole);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") redirect("/login");
      if (error.code === "NO_ACTIVE_ORGANIZATION") redirect("/organization");
      if (error.code === "PROJECTION_MISSING" || error.code === "ROLE_MISMATCH" || error.code === "PERMANENTLY_REVOKED" || error.code === "TENANT_ISOLATION_LOCKED") {
        redirect("/access");
      }
      throw error;
    }
    throw error;
  }
}

/** Server Action boundary: expected auth failures are returned, not thrown. */
export async function authorizeAction(
  minimumRole?: MembershipRole,
): Promise<AuthorizationContext | AuthorizationFailure> {
  try {
    return await requireAuthorization(minimumRole);
  } catch (error) {
    if (error instanceof AuthorizationError) return authorizationFailure(error);
    throw error;
  }
}
