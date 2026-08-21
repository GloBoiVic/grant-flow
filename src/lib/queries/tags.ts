import "server-only";

import { requireAuthorization } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import { serializeTag } from "@/lib/queries/serializers";
import type { TagListDto } from "@/types/tag";

const tagFields = { id: true, name: true } as const;

export async function listTags(): Promise<TagListDto> {
  const authorization = await requireAuthorization();
  const tags = await prisma.tag.findMany({
    where: { organizationId: authorization.organizationId, deletedAt: null },
    select: tagFields,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return { items: tags.map(serializeTag) };
}
