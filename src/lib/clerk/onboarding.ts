import "server-only";

import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

type ClaimOperations = {
  onboardingClaim: {
    create(args: { data: { clerkUserId: string; name: string; slug: string }; select: Record<string, boolean> }): Promise<unknown>;
    findUnique(args: { where: { clerkUserId?: string; id?: string }; select: Record<string, boolean> }): Promise<unknown>;
    updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  };
};

export type OnboardingClaim = {
  id: string;
  clerkUserId: string;
  name: string;
  slug: string;
  clerkOrgId: string | null;
  createLeaseToken?: string | null;
  createLeaseExpiresAt?: Date | null;
};

export const ONBOARDING_LEASE_MS = 60_000;

export type LeaseAcquisition =
  | { status: "acquired"; claim: OnboardingClaim; leaseToken: string }
  | { status: "already-finalized"; claim: OnboardingClaim }
  | { status: "busy" };

/** Keep the Clerk slug stable for a user so retries can find an ambiguous create. */
export function onboardingSlug(name: string, clerkUserId: string): string {
  const readable = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "organization";
  const suffix = createHash("sha256").update(clerkUserId).digest("hex").slice(0, 12);
  return `grantflow-${readable}-${suffix}`.slice(0, 64);
}

export async function acquireOnboardingClaim(clerkUserId: string, name: string): Promise<OnboardingClaim> {
  return acquireOnboardingClaimWithDb(prisma, clerkUserId, name);
}

/** Dependency-injected only for proving cross-client races against one durable database. */
export async function acquireOnboardingClaimWithDb(
  db: unknown,
  clerkUserId: string,
  name: string,
): Promise<OnboardingClaim> {
  const claims = (db as ClaimOperations).onboardingClaim;
  const slug = onboardingSlug(name, clerkUserId);
  try {
    return await claims.create({
      data: { clerkUserId, name, slug },
       select: { id: true, clerkUserId: true, name: true, slug: true, clerkOrgId: true, createLeaseToken: true, createLeaseExpiresAt: true },
    }) as OnboardingClaim;
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const existing = await claims.findUnique({
      where: { clerkUserId },
       select: { id: true, clerkUserId: true, name: true, slug: true, clerkOrgId: true, createLeaseToken: true, createLeaseExpiresAt: true },
    });
    if (!existing) throw error;
    return existing as OnboardingClaim;
  }
}

function claimSelect(): Record<string, boolean> {
  return { id: true, clerkUserId: true, name: true, slug: true, clerkOrgId: true, createLeaseToken: true, createLeaseExpiresAt: true };
}

/** Acquire the single durable lease with an atomic compare-and-set. */
export async function acquireOnboardingLease(claim: OnboardingClaim): Promise<LeaseAcquisition> {
  return acquireOnboardingLeaseWithDb(prisma, claim);
}

export async function acquireOnboardingLeaseWithDb(db: unknown, claim: OnboardingClaim): Promise<LeaseAcquisition> {
  if (claim.clerkOrgId) return { status: "already-finalized", claim };
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + ONBOARDING_LEASE_MS);
  const count = await (db as ClaimOperations).onboardingClaim.updateMany({
    where: {
      id: claim.id,
      clerkUserId: claim.clerkUserId,
      slug: claim.slug,
      clerkOrgId: null,
      OR: [{ createLeaseToken: null }, { createLeaseExpiresAt: { lte: new Date() } }],
    },
    data: { createLeaseToken: token, createLeaseExpiresAt: expiresAt },
  });
  if (count.count !== 1) return { status: "busy" };
  const current = await (db as ClaimOperations).onboardingClaim.findUnique({ where: { id: claim.id }, select: claimSelect() });
  if (!current) return { status: "busy" };
  return { status: "acquired", claim: current as OnboardingClaim, leaseToken: token };
}

export async function renewOnboardingLease( claimId: string, leaseToken: string): Promise<boolean> {
  return renewOnboardingLeaseWithDb(prisma, claimId, leaseToken);
}

export async function renewOnboardingLeaseWithDb(db: unknown, claimId: string, leaseToken: string): Promise<boolean> {
  const now = new Date();
  const result = await (db as ClaimOperations).onboardingClaim.updateMany({
    where: { id: claimId, createLeaseToken: leaseToken, clerkOrgId: null, createLeaseExpiresAt: { gt: now } },
    data: { createLeaseExpiresAt: new Date(Date.now() + ONBOARDING_LEASE_MS) },
  });
  return result.count === 1;
}

export async function releaseOnboardingLease(claimId: string, leaseToken: string): Promise<boolean> {
  return releaseOnboardingLeaseWithDb(prisma, claimId, leaseToken);
}

export async function releaseOnboardingLeaseWithDb(db: unknown, claimId: string, leaseToken: string): Promise<boolean> {
  const result = await (db as ClaimOperations).onboardingClaim.updateMany({
    where: { id: claimId, createLeaseToken: leaseToken, clerkOrgId: null },
    data: { createLeaseToken: null, createLeaseExpiresAt: null },
  });
  return result.count === 1;
}

/** Finalize only the lease owner; a stale owner cannot bind a claim. */
export async function finalizeOnboardingLease(claimId: string, leaseToken: string, clerkOrgId: string): Promise<string | null> {
  return finalizeOnboardingLeaseWithDb(prisma, claimId, leaseToken, clerkOrgId);
}

export async function finalizeOnboardingLeaseWithDb(db: unknown, claimId: string, leaseToken: string, clerkOrgId: string): Promise<string | null> {
  const claims = (db as ClaimOperations).onboardingClaim;
  const now = new Date();
  const result = await claims.updateMany({
    where: { id: claimId, createLeaseToken: leaseToken, clerkOrgId: null, createLeaseExpiresAt: { gt: now } },
    data: { clerkOrgId, createLeaseToken: null, createLeaseExpiresAt: null },
  });
  return result.count === 1 ? clerkOrgId : null;
}

export function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
