import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import { serializeActivity, serializeDate } from "@/lib/queries/serializers";
import { GrantStatus, type GrantStatus as GrantStatusValue } from "@/lib/validations/grant";
import type { GrantDetailDto, GrantListDto } from "@/types/grant";

export interface ListGrantsOptions {
  cursor?: string;
  limit?: number;
}

const DEFAULT_GRANT_LIMIT = 25;
const MAX_GRANT_LIMIT = 100;

const grantFields = {
  id: true,
  funderId: true,
  title: true,
  status: true,
  currency: true,
  amountRequested: true,
  amountAwarded: true,
  deadline: true,
  decisionDate: true,
  awardTimeframe: true,
  designation: true,
  countyServed: true,
  nextSteps: true,
  notes: true,
  ownerId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

const funderFields = { id: true, name: true, type: true, website: true, createdAt: true, updatedAt: true } as const;

const activityFields = { id: true, action: true, description: true, metadata: true, actorId: true, createdAt: true } as const;

function boundedLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_GRANT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_GRANT_LIMIT);
}

function serializeStatus(status: string): GrantStatusValue {
  return status === "InternalReview" ? GrantStatus.InternalReview : status as GrantStatusValue;
}

type GrantBaseDto = Omit<GrantDetailDto, "funder" | "activities">;

function serializeGrant(grant: {
  id: string;
  funderId: string;
  title: string;
  status: string;
  currency: string;
  amountRequested: { toString(): string } | null;
  amountAwarded: { toString(): string } | null;
  deadline: Date | null;
  decisionDate: Date | null;
  awardTimeframe: string | null;
  designation: string | null;
  countyServed: string | null;
  nextSteps: string | null;
  notes: string | null;
  ownerId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): GrantBaseDto {
  return {
    id: grant.id,
    funderId: grant.funderId,
    title: grant.title,
    status: serializeStatus(grant.status),
    currency: grant.currency,
    amountRequested: grant.amountRequested?.toString() ?? null,
    amountAwarded: grant.amountAwarded?.toString() ?? null,
    deadline: serializeDate(grant.deadline),
    decisionDate: serializeDate(grant.decisionDate),
    awardTimeframe: grant.awardTimeframe,
    designation: grant.designation,
    countyServed: grant.countyServed,
    nextSteps: grant.nextSteps,
    notes: grant.notes,
    ownerId: grant.ownerId,
    createdById: grant.createdById,
    createdAt: grant.createdAt.toISOString(),
    updatedAt: grant.updatedAt.toISOString(),
  };
}

export async function listGrants(options: ListGrantsOptions = {}): Promise<GrantListDto> {
  const authorization = await requireAuthorization();
  const limit = boundedLimit(options.limit);
  const grants = await prisma.grant.findMany({
    where: {
      organizationId: authorization.organizationId,
      deletedAt: null,
      funder: { organizationId: authorization.organizationId, deletedAt: null },
    },
    select: { ...grantFields, funder: { select: { id: true, name: true, type: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasNextPage = grants.length > limit;
  const items = (hasNextPage ? grants.slice(0, limit) : grants).map((grant) => ({ ...serializeGrant(grant), funder: grant.funder }));
  return { items, nextCursor: hasNextPage ? items[items.length - 1]?.id ?? null : null };
}

export async function getGrant(grantId: string): Promise<GrantDetailDto | null> {
  const authorization = await requireAuthorization();
  const grant = await prisma.grant.findFirst({
    where: {
      id: grantId,
      organizationId: authorization.organizationId,
      deletedAt: null,
      funder: { organizationId: authorization.organizationId, deletedAt: null },
    },
    select: {
      ...grantFields,
      funder: { select: funderFields },
      activities: {
        where: { organizationId: authorization.organizationId },
        select: activityFields,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
    },
  });
  if (!grant) return null;
  return {
    ...serializeGrant(grant),
    funder: { ...grant.funder, createdAt: grant.funder.createdAt.toISOString(), updatedAt: grant.funder.updatedAt.toISOString() },
    activities: grant.activities.map(serializeActivity),
  };
}
