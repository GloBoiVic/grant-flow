import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import { serializeDate } from "@/lib/queries/serializers";
import { GrantStatus } from "@/lib/validations/grant";
import type { PortfolioExportRow } from "@/lib/export/portfolio-csv";

const funderTypeLabels: Record<string, string> = {
  FOUNDATION: "Foundation",
  FAMILY_FUND: "Family Fund",
  CORPORATION: "Corporation",
  OTHER: "Other",
};

function displayStatus(status: string): string {
  return status === "InternalReview" ? GrantStatus.InternalReview : status;
}

function displayFunderType(type: string): string {
  return funderTypeLabels[type] ?? type;
}

function formatAmount(value: { toString(): string } | null): string | null {
  if (value === null) return null;

  const raw = value.toString();
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [integer = "0", fraction = ""] = unsigned.split(".");
  return `${negative ? "-" : ""}${integer || "0"}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export async function getPortfolioExport(): Promise<PortfolioExportRow[]> {
  const authorization = await requireAuthorization();
  const organizationId = authorization.organizationId;
  const grants = await prisma.grant.findMany({
    where: {
      organizationId,
      deletedAt: null,
      funder: { organizationId, deletedAt: null },
    },
    select: {
      id: true,
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
      funder: { select: { name: true, type: true, website: true, countyServed: true, notes: true } },
      grantTags: {
        where: { tag: { organizationId, deletedAt: null } },
        select: { tag: { select: { id: true, name: true } } },
        orderBy: [{ tag: { name: "asc" as const } }, { tag: { id: "asc" as const } }],
      },
    },
    orderBy: [
      { deadline: { sort: "asc", nulls: "last" } },
      { funder: { name: "asc" } },
      { title: "asc" },
      { id: "asc" },
    ],
  });

  return grants.map((grant) => ({
    grantTitle: grant.title,
    funderName: grant.funder.name,
    funderType: displayFunderType(grant.funder.type),
    funderWebsite: grant.funder.website,
    funderCountyServed: grant.funder.countyServed,
    funderNotes: grant.funder.notes,
    status: displayStatus(grant.status),
    amountRequested: formatAmount(grant.amountRequested),
    amountAwarded: formatAmount(grant.amountAwarded),
    currency: grant.currency,
    deadline: serializeDate(grant.deadline),
    decisionDate: serializeDate(grant.decisionDate),
    awardTimeframe: grant.awardTimeframe,
    designation: grant.designation,
    countyServed: grant.countyServed,
    nextSteps: grant.nextSteps,
    notes: grant.notes,
    tags: grant.grantTags.map(({ tag }) => tag.name),
  }));
}
