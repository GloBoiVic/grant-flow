import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { addUtcDays, formatUtcDate, toUtcDateOnly, utcToday } from "@/lib/dates/utc-dates";
import { GrantStatus as DisplayGrantStatus } from "@/lib/validations/grant";
import { prisma } from "@/lib/prisma";
import type { DashboardDto } from "@/types/dashboard";
import type { GrantStatus as PrismaGrantStatus } from "@/generated/prisma/enums";

// Display lifecycle order — must match PLAN.md section "Status breakdown"
const DISPLAY_STATUSES: DisplayGrantStatus[] = [
  DisplayGrantStatus.Research,
  DisplayGrantStatus.Qualified,
  DisplayGrantStatus.Planning,
  DisplayGrantStatus.Writing,
  DisplayGrantStatus.InternalReview,
  DisplayGrantStatus.Submitted,
  DisplayGrantStatus.Pending,
  DisplayGrantStatus.Awarded,
  DisplayGrantStatus.Declined,
  DisplayGrantStatus.Reporting,
  DisplayGrantStatus.Closed,
];

// Prisma enum values in same order (InternalReview vs "Internal Review") — kept for lifecycle reference

// Mapping display label -> prisma value
const PRISMA_BY_DISPLAY: Record<DisplayGrantStatus, PrismaGrantStatus> = {
  Research: "Research",
  Qualified: "Qualified",
  Planning: "Planning",
  Writing: "Writing",
  "Internal Review": "InternalReview",
  Submitted: "Submitted",
  Pending: "Pending",
  Awarded: "Awarded",
  Declined: "Declined",
  Reporting: "Reporting",
  Closed: "Closed",
};

const DISPLAY_BY_PRISMA: Record<PrismaGrantStatus, DisplayGrantStatus> = {
  Research: "Research",
  Qualified: "Qualified",
  Planning: "Planning",
  Writing: "Writing",
  InternalReview: "Internal Review",
  Submitted: "Submitted",
  Pending: "Pending",
  Awarded: "Awarded",
  Declined: "Declined",
  Reporting: "Reporting",
  Closed: "Closed",
};

// Pre-submission = Research, Qualified, Planning, Writing, Internal Review/InternalReview
const PRE_SUBMISSION_DISPLAY: DisplayGrantStatus[] = [
  DisplayGrantStatus.Research,
  DisplayGrantStatus.Qualified,
  DisplayGrantStatus.Planning,
  DisplayGrantStatus.Writing,
  DisplayGrantStatus.InternalReview,
];
const PRE_SUBMISSION_PRISMA: PrismaGrantStatus[] = PRE_SUBMISSION_DISPLAY.map(
  (s) => PRISMA_BY_DISPLAY[s],
);

// Open pipeline = Research, Qualified, Planning, Writing, Internal Review, Submitted, Pending
const OPEN_PIPELINE_DISPLAY: DisplayGrantStatus[] = [
  DisplayGrantStatus.Research,
  DisplayGrantStatus.Qualified,
  DisplayGrantStatus.Planning,
  DisplayGrantStatus.Writing,
  DisplayGrantStatus.InternalReview,
  DisplayGrantStatus.Submitted,
  DisplayGrantStatus.Pending,
];

function toDisplayStatus(prismaStatus: string): DisplayGrantStatus {
  return (DISPLAY_BY_PRISMA[prismaStatus as PrismaGrantStatus] ?? prismaStatus) as DisplayGrantStatus;
}

export async function getDashboard(input?: { today?: Date }): Promise<DashboardDto> {
  const authorization = await requireAuthorization();
  const organizationId = authorization.organizationId;

  const todayUtc = input?.today ? toUtcDateOnly(input.today) : utcToday();
  const todayPlus7 = addUtcDays(todayUtc, 7);
  const todayPlus30 = addUtcDays(todayUtc, 30);

  const trackedWhere = {
    organizationId,
    deletedAt: null,
    funder: { organizationId, deletedAt: null },
  };

  // Bound: status aggregation, sums, overdue, dueIn7, upcoming
  const [grouped, sums, overdueCount, dueIn7Count, upcomingRows] = await Promise.all([
    prisma.grant.groupBy({
      by: ["status"],
      where: trackedWhere,
      _count: { _all: true },
    }),
    prisma.grant.aggregate({
      where: trackedWhere,
      _sum: { amountRequested: true, amountAwarded: true },
    }),
    prisma.grant.count({
      where: {
        ...trackedWhere,
        status: { in: PRE_SUBMISSION_PRISMA },
        deadline: { lt: todayUtc },
      },
    }),
    prisma.grant.count({
      where: {
        ...trackedWhere,
        status: { in: PRE_SUBMISSION_PRISMA },
        deadline: { gte: todayUtc, lte: todayPlus7 },
      },
    }),
    prisma.grant.findMany({
      where: {
        ...trackedWhere,
        status: { in: PRE_SUBMISSION_PRISMA },
        deadline: { gte: todayUtc, lte: todayPlus30 },
      },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        funder: { select: { name: true } },
      },
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
      take: 5,
    }),
  ]);

  // Build status map from groupBy result; Prisma groupBy returns { status, _count: { _all } }
  const countByPrismaStatus = new Map<string, number>();
  for (const row of grouped as Array<{ status: string; _count: { _all: number } }>) {
    countByPrismaStatus.set(row.status, row._count._all);
  }

  // Zero-fill breakdown in lifecycle order (display labels)
  const breakdown: DashboardDto["breakdown"] = DISPLAY_STATUSES.map((displayStatus) => {
    const prismaStatus = PRISMA_BY_DISPLAY[displayStatus];
    const count = countByPrismaStatus.get(prismaStatus) ?? 0;
    return { status: displayStatus, count };
  });

  const trackedGrants = breakdown.reduce((sum, b) => sum + b.count, 0);
  const openPipeline = OPEN_PIPELINE_DISPLAY.reduce((sum, displayStatus) => {
    const prismaStatus = PRISMA_BY_DISPLAY[displayStatus];
    return sum + (countByPrismaStatus.get(prismaStatus) ?? 0);
  }, 0);

  const requestedTotal = (sums._sum.amountRequested?.toString() ?? "0");
  const awardedTotal = (sums._sum.amountAwarded?.toString() ?? "0");

  const upcoming: DashboardDto["upcoming"] = upcomingRows.map((row) => ({
    id: row.id,
    title: row.title,
    funderName: row.funder.name,
    deadline: row.deadline ? formatUtcDate(row.deadline) : "",
    status: toDisplayStatus(row.status),
  })).filter((r) => r.deadline !== "");

  return {
    asOf: formatUtcDate(todayUtc),
    totals: {
      trackedGrants,
      openPipeline,
      requestedTotal,
      awardedTotal,
      currency: "USD",
    },
    attention: {
      overdueCount,
      dueIn7Count,
    },
    upcoming,
    breakdown,
  };
}

// Re-export helpers for test convenience (not required but keeps import surface minimal)
export const __testing = {
  DISPLAY_STATUSES,
  PRE_SUBMISSION_PRISMA,
  PRISMA_BY_DISPLAY,
  DISPLAY_BY_PRISMA,
  toDisplayStatus,
};
