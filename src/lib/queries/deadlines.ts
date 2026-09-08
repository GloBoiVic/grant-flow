import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { addUtcDays, formatUtcDate, toUtcDateOnly, utcToday } from "@/lib/dates/utc-dates";
import { prisma } from "@/lib/prisma";
import { GrantStatus, type GrantStatus as DisplayGrantStatus } from "@/lib/validations/grant";
import type { GrantStatus as PrismaGrantStatus } from "@/generated/prisma/enums";
import type { DeadlineItem, DeadlineViewDto } from "@/types/deadline";

const PRE_SUBMISSION_PRISMA: PrismaGrantStatus[] = [
  "Research",
  "Qualified",
  "Planning",
  "Writing",
  "InternalReview",
];

function toDisplayStatus(status: PrismaGrantStatus): DisplayGrantStatus {
  return status === "InternalReview" ? GrantStatus.InternalReview : status as DisplayGrantStatus;
}

export async function getDeadlineView(input?: { today?: Date }): Promise<DeadlineViewDto> {
  const authorization = await requireAuthorization();
  const organizationId = authorization.organizationId;
  const today = input?.today ? toUtcDateOnly(input.today) : utcToday();
  const todayPlus7 = addUtcDays(today, 7);
  const todayPlus8 = addUtcDays(today, 8);
  const todayPlus30 = addUtcDays(today, 30);

  const trackedWhere = {
    organizationId,
    deletedAt: null,
    funder: { organizationId, deletedAt: null },
  };

  const [trackedGrantCount, rows] = await Promise.all([
    prisma.grant.count({ where: trackedWhere }),
    prisma.grant.findMany({
      where: {
        ...trackedWhere,
        status: { in: PRE_SUBMISSION_PRISMA },
        deadline: { lte: todayPlus30 },
      },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        funder: { select: { name: true } },
      },
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
    }),
  ]);

  const groups: DeadlineViewDto["groups"] = { overdue: [], dueSoon: [], later: [] };
  for (const row of rows) {
    if (row.deadline === null) continue;

    const deadline = toUtcDateOnly(row.deadline);
    const item: DeadlineItem = {
      id: row.id,
      title: row.title,
      funderName: row.funder.name,
      deadline: formatUtcDate(deadline),
      status: toDisplayStatus(row.status),
    };

    if (deadline < today) groups.overdue.push(item);
    else if (deadline >= today && deadline <= todayPlus7) groups.dueSoon.push(item);
    else if (deadline >= todayPlus8 && deadline <= todayPlus30) groups.later.push(item);
  }

  return { asOf: formatUtcDate(today), trackedGrantCount, groups };
}
