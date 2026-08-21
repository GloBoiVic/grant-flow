import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import type { FunderDto, FunderListDto } from "@/types/funder";

const funderSelect = {
  id: true,
  name: true,
  type: true,
  website: true,
  createdAt: true,
  updatedAt: true,
} as const;

type FunderRecord = {
  id: string;
  name: string;
  type: FunderDto["type"];
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toFunderDto(funder: FunderRecord): FunderDto {
  return {
    id: funder.id,
    name: funder.name,
    type: funder.type,
    website: funder.website,
    createdAt: funder.createdAt.toISOString(),
    updatedAt: funder.updatedAt.toISOString(),
  };
}

export async function listFunders(): Promise<FunderListDto> {
  const authorization = await requireAuthorization();
  const funders = await prisma.funder.findMany({
    where: { organizationId: authorization.organizationId, deletedAt: null },
    select: funderSelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return { items: funders.map(toFunderDto) };
}
