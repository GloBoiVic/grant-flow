import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeActivity, serializeDate, serializeTag } from "@/lib/queries/serializers";
import { GrantStatus, type GrantStatus as GrantStatusValue } from "@/lib/validations/grant";
import { GRANT_LIST_PAGE_SIZE, type GrantListQueryOptions, type GrantSortDirection, toPrismaStatuses } from "@/lib/queries/grant-list-contract";
import type { GrantDetailDto, GrantListDto } from "@/types/grant";

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
  grantTags: Array<{ tag: { id: string; name: string } }>;
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
    tags: grant.grantTags.map(({ tag }) => serializeTag(tag)),
  };
}

function assignedTags(organizationId: string) {
  return {
    where: { tag: { organizationId, deletedAt: null } },
    select: { tag: { select: { id: true, name: true } } },
    orderBy: { tag: { name: "asc" as const } },
  } as const;
}

const defaultListOptions: GrantListQueryOptions = {
  statuses: [],
  tagIds: [],
  sort: "deadline",
  direction: "asc",
  page: 1,
};

export async function listGrants(options: GrantListQueryOptions = defaultListOptions): Promise<GrantListDto> {
  const authorization = await requireAuthorization();
  const direction: GrantSortDirection = options.direction;
  const search = options.q ? { contains: options.q, mode: "insensitive" as const } : undefined;
  const tagFilter = options.tagIds.length > 0 ? {
    some: { tagId: { in: options.tagIds }, tag: { organizationId: authorization.organizationId, deletedAt: null } },
  } : undefined;
  const orderBy: Prisma.GrantOrderByWithRelationInput[] = options.sort === "funder"
    ? [{ funder: { name: direction } }, { id: direction }]
    : options.sort === "title"
      ? [{ title: direction }, { id: direction }]
      : options.sort === "status"
        ? [{ status: direction }, { id: direction }]
        : options.sort === "requested"
          ? [{ amountRequested: { sort: direction, nulls: "last" as const } }, { id: direction }]
          : options.sort === "awarded"
            ? [{ amountAwarded: { sort: direction, nulls: "last" as const } }, { id: direction }]
            : [{ deadline: { sort: direction, nulls: "last" as const } }, { id: direction }];
  const grants = await prisma.grant.findMany({
    where: {
      organizationId: authorization.organizationId,
      deletedAt: null,
      funder: { organizationId: authorization.organizationId, deletedAt: null },
      ...(search ? { OR: [{ title: search }, { funder: { name: search, organizationId: authorization.organizationId, deletedAt: null } }] } : {}),
      ...(options.statuses.length > 0 ? { status: { in: toPrismaStatuses(options.statuses) } } : {}),
      ...(tagFilter ? { grantTags: tagFilter } : {}),
    },
    select: { ...grantFields, funder: { select: { id: true, name: true, type: true } }, grantTags: assignedTags(authorization.organizationId) },
    orderBy,
    skip: (options.page - 1) * GRANT_LIST_PAGE_SIZE,
    take: GRANT_LIST_PAGE_SIZE + 1,
  });
  const hasNextPage = grants.length > GRANT_LIST_PAGE_SIZE;
  const items = (hasNextPage ? grants.slice(0, GRANT_LIST_PAGE_SIZE) : grants).map((grant) => ({ ...serializeGrant(grant), funder: grant.funder }));
  return { items, page: options.page, hasNextPage, hasPreviousPage: options.page > 1 };
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
       grantTags: assignedTags(authorization.organizationId),
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
