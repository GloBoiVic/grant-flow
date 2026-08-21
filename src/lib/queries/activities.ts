import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import { serializeActivity } from "@/lib/queries/serializers";
import type { ActivityDto } from "@/types/grant";

export interface ListActivitiesOptions {
  grantId?: string;
  funderId?: string;
  limit?: number;
}

const DEFAULT_ACTIVITY_LIMIT = 50;
const MAX_ACTIVITY_LIMIT = 100;

function boundedLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_ACTIVITY_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_ACTIVITY_LIMIT);
}

export async function listActivities(options: ListActivitiesOptions = {}): Promise<ActivityDto[]> {
  const authorization = await requireAuthorization();
  const limit = boundedLimit(options.limit);
  const activities = await prisma.activity.findMany({
    where: {
      organizationId: authorization.organizationId,
      ...(options.grantId ? { grantId: options.grantId, grant: { organizationId: authorization.organizationId, deletedAt: null } } : {}),
      ...(options.funderId ? { funderId: options.funderId, funder: { organizationId: authorization.organizationId, deletedAt: null } } : {}),
    },
    select: {
      id: true,
      action: true,
      description: true,
      metadata: true,
      actorId: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return activities.map(serializeActivity);
}
