"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { authorizeAction } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import { normalizeTagName, assignTagSchema, createTagSchema, removeTagSchema } from "@/lib/validations/tag";
import type { ActionResult } from "@/types/common";
import type { AssignTagResult, CreateTagResult, RemoveTagResult, TagDto } from "@/types/tag";

const TAG_NOT_FOUND = "Grant or tag not found.";
const TAG_NAME_CONFLICT = "A tag with this name already exists.";

function invalid<T>(error: string, errors?: Record<string, string[]>): ActionResult<T> {
  return { success: false, error, ...(errors ? { errors } : {}) };
}

function validationErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((result, issue) => {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= [];
    result[key].push(issue.message);
    return result;
  }, {});
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    && (error as { code?: unknown }).code === "P2002";
}

function tagDto(tag: { id: string; name: string }): TagDto {
  return { id: tag.id, name: tag.name };
}

function assignedTags(organizationId: string) {
  return {
    where: { tag: { organizationId, deletedAt: null } },
    select: { tag: { select: { id: true, name: true } } },
    orderBy: { tag: { name: "asc" as const } },
  } as const;
}

async function activeAssignedTags(
  tx: Prisma.TransactionClient,
  organizationId: string,
  grantId: string,
): Promise<TagDto[]> {
  const relations = await tx.grantTag.findMany({
    where: { grantId, ...assignedTags(organizationId).where },
    select: assignedTags(organizationId).select,
    orderBy: assignedTags(organizationId).orderBy,
  });
  return relations.map(({ tag }) => tagDto(tag));
}

export async function createTag(input: unknown): Promise<CreateTagResult> {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid tag details.", validationErrors(parsed.error));

  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;

  try {
    const tag = await prisma.tag.create({
      data: {
        organizationId: authorization.organizationId,
        name: parsed.data.name,
        normalizedName: normalizeTagName(parsed.data.name),
      },
      select: { id: true, name: true },
    });
    revalidatePath("/grants");
    return { success: true, data: tagDto(tag) };
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    return invalid(TAG_NAME_CONFLICT, { name: [TAG_NAME_CONFLICT] });
  }
}

export async function assignTagToGrant(input: unknown): Promise<AssignTagResult> {
  const parsed = assignTagSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid tag assignment.", validationErrors(parsed.error));

  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;

  const tags = await prisma.$transaction(async (tx) => {
    const grant = await tx.grant.findFirst({
      where: {
        id: parsed.data.grantId,
        organizationId: authorization.organizationId,
        deletedAt: null,
        funder: { organizationId: authorization.organizationId, deletedAt: null },
      },
      select: { id: true },
    });
    const tag = await tx.tag.findFirst({
      where: { id: parsed.data.tagId, organizationId: authorization.organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!grant || !tag) return null;

    const existing = await tx.grantTag.findFirst({
      where: { grantId: grant.id, tagId: tag.id },
      select: { grantId: true },
    });
    if (!existing) {
      await tx.grantTag.createMany({ data: { grantId: grant.id, tagId: tag.id }, skipDuplicates: true });
    }
    return activeAssignedTags(tx, authorization.organizationId, grant.id);
  });

  if (tags === null) return invalid(TAG_NOT_FOUND);
  revalidatePath("/grants");
  return { success: true, data: tags };
}

export async function removeTagFromGrant(input: unknown): Promise<RemoveTagResult> {
  const parsed = removeTagSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid tag assignment.", validationErrors(parsed.error));

  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;

  const tags = await prisma.$transaction(async (tx) => {
    const grant = await tx.grant.findFirst({
      where: {
        id: parsed.data.grantId,
        organizationId: authorization.organizationId,
        deletedAt: null,
        funder: { organizationId: authorization.organizationId, deletedAt: null },
      },
      select: { id: true },
    });
    const tag = await tx.tag.findFirst({
      where: { id: parsed.data.tagId, organizationId: authorization.organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!grant || !tag) return null;

    const existing = await tx.grantTag.findFirst({
      where: { grantId: grant.id, tagId: tag.id },
      select: { grantId: true },
    });
    if (existing) await tx.grantTag.deleteMany({ where: { grantId: grant.id, tagId: tag.id } });
    return activeAssignedTags(tx, authorization.organizationId, grant.id);
  });

  if (tags === null) return invalid(TAG_NOT_FOUND);
  revalidatePath("/grants");
  return { success: true, data: tags };
}
