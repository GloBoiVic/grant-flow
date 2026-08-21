import type { OnboardingClaim } from "@/lib/clerk/onboarding";

type ClerkOrganization = {
  id: string;
  slug: string;
  createdBy?: string;
  privateMetadata?: Record<string, unknown> | null;
};

type ClerkOrganizationsClient = {
  organizations: {
    getOrganization: (params: { slug: string }) => Promise<ClerkOrganization>;
  };
};

export type OrganizationLookup =
  | { status: "found"; organization: ClerkOrganization }
  | { status: "not-found" }
  | { status: "transient" };

export const CLERK_ORCHESTRATION_TIMEOUT_MS = 10_000;

export function withClerkTimeout<T>(operation: Promise<T>, timeoutMs = CLERK_ORCHESTRATION_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Clerk onboarding timed out")), timeoutMs);
    operation.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

export async function recoverOrganizationBySlug(
  client: ClerkOrganizationsClient,
  claim: OnboardingClaim,
): Promise<OrganizationLookup> {
  try {
    return { status: "found", organization: await withClerkTimeout(client.organizations.getOrganization({ slug: claim.slug })) };
  } catch (error) {
    if (isNotFound(error)) return { status: "not-found" };
    return { status: "transient" };
  }
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    errors?: Array<{ status?: unknown; statusCode?: unknown; code?: unknown }>;
  };
  return candidate.status === 404
    || candidate.statusCode === 404
    || candidate.errors?.some((item) => item.status === 404 || item.statusCode === 404 || item.code === "resource_not_found") === true;
}

export function clerkOrganizationMatchesClaim(
  organization: ClerkOrganization,
  claim: OnboardingClaim,
): boolean {
  return organization.id.length > 0
    && organization.slug === claim.slug
    && organization.createdBy === claim.clerkUserId
    && organization.privateMetadata?.grantflowOnboardingClaimId === claim.id
    && organization.privateMetadata?.grantflowOnboardingUserId === claim.clerkUserId;
}
