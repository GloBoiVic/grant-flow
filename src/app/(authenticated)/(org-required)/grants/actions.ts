"use server";

import { revalidatePath } from "next/cache";

import { authorizeAction } from "@/lib/clerk/authorization";
import { prisma } from "@/lib/prisma";
import { createFunderSchema } from "@/lib/validations/funder";
import { changeGrantStatusSchema, createGrantSchema, editGrantSchema } from "@/lib/validations/grant";
import type { ActionResult } from "@/types/common";
import type { CreateFunderResult } from "@/types/funder";
import type { ChangeGrantStatusResult, CreateGrantResult, EditGrantResult, GrantDetailDto } from "@/types/grant";

const grantSelect = {
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
  funder: { select: { id: true, name: true, type: true, website: true, createdAt: true, updatedAt: true } },
} as const;

function dateValue(value: string | null | undefined): Date | null | undefined {
  return value === undefined ? undefined : value === null ? null : new Date(`${value}T00:00:00.000Z`);
}

function grantDto(grant: {
  id: string; funderId: string; title: string; status: string; currency: string;
  amountRequested: { toString(): string } | null; amountAwarded: { toString(): string } | null;
  deadline: Date | null; decisionDate: Date | null; awardTimeframe: string | null;
  designation: string | null; countyServed: string | null; nextSteps: string | null; notes: string | null;
  ownerId: string | null; createdById: string; createdAt: Date; updatedAt: Date;
  funder: { id: string; name: string; type: "FOUNDATION" | "FAMILY_FUND" | "CORPORATION" | "OTHER"; website: string | null; createdAt: Date; updatedAt: Date };
}, activity: GrantDetailDto["activities"][number] | null): GrantDetailDto {
  return {
    id: grant.id, funderId: grant.funderId, title: grant.title, status: (grant.status === "InternalReview" ? "Internal Review" : grant.status) as GrantDetailDto["status"],
    currency: grant.currency, amountRequested: grant.amountRequested?.toString() ?? null,
    amountAwarded: grant.amountAwarded?.toString() ?? null, deadline: grant.deadline?.toISOString().slice(0, 10) ?? null,
    decisionDate: grant.decisionDate?.toISOString().slice(0, 10) ?? null, awardTimeframe: grant.awardTimeframe,
    designation: grant.designation, countyServed: grant.countyServed, nextSteps: grant.nextSteps, notes: grant.notes,
    ownerId: grant.ownerId, createdById: grant.createdById, createdAt: grant.createdAt.toISOString(), updatedAt: grant.updatedAt.toISOString(),
    funder: { ...grant.funder, createdAt: grant.funder.createdAt.toISOString(), updatedAt: grant.funder.updatedAt.toISOString() },
    activities: activity ? [activity] : [],
  };
}

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

function databaseStatus(status: string): "Research" | "Qualified" | "Planning" | "Writing" | "InternalReview" | "Submitted" | "Pending" | "Awarded" | "Declined" | "Reporting" | "Closed" {
  return (status === "Internal Review" ? "InternalReview" : status) as ReturnType<typeof databaseStatus>;
}

export async function createFunder(input: unknown): Promise<CreateFunderResult> {
  const parsed = createFunderSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid funder details.", validationErrors(parsed.error));
  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;
  const funder = await prisma.$transaction(async (tx) => {
    const created = await tx.funder.create({ data: { organizationId: authorization.organizationId, name: parsed.data.name, type: parsed.data.type, website: parsed.data.website ?? null } });
    await tx.activity.create({ data: { organizationId: authorization.organizationId, funderId: created.id, action: "funder_created", description: `Created funder ${created.name}.`, actorId: authorization.userId } });
    return created;
  });
  revalidatePath("/grants");
  return { success: true, data: { id: funder.id, name: funder.name, type: funder.type, website: funder.website, createdAt: funder.createdAt.toISOString(), updatedAt: funder.updatedAt.toISOString() } };
}

export async function createGrant(input: unknown): Promise<CreateGrantResult> {
  const parsed = createGrantSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid grant details.", validationErrors(parsed.error));
  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;
  const result = await prisma.$transaction(async (tx) => {
    const funder = await tx.funder.findFirst({ where: { id: parsed.data.funderId, organizationId: authorization.organizationId, deletedAt: null } });
    if (!funder) return null;
    const grant = await tx.grant.create({ data: {
      organizationId: authorization.organizationId, funderId: funder.id, title: parsed.data.title, status: databaseStatus(parsed.data.status),
      amountRequested: parsed.data.amountRequested ?? null, amountAwarded: parsed.data.amountAwarded ?? null,
      deadline: dateValue(parsed.data.deadline), decisionDate: dateValue(parsed.data.decisionDate), awardTimeframe: parsed.data.awardTimeframe ?? null,
      designation: parsed.data.designation ?? null, countyServed: parsed.data.countyServed ?? null, nextSteps: parsed.data.nextSteps ?? null,
      notes: parsed.data.notes ?? null, ownerId: authorization.userId, createdById: authorization.userId,
    }, select: grantSelect });
    const activity = await tx.activity.create({ data: { organizationId: authorization.organizationId, grantId: grant.id, action: "grant_created", description: `Created grant ${grant.title}.`, actorId: authorization.userId, metadata: { status: grant.status } } });
    return { grant, activity };
  });
  if (!result) return invalid("Funder not found.");
  revalidatePath("/grants");
  return { success: true, data: grantDto(result.grant, { id: result.activity.id, action: result.activity.action, description: result.activity.description, metadata: result.activity.metadata as Record<string, unknown> | null, actorId: result.activity.actorId, createdAt: result.activity.createdAt.toISOString() }) };
}

export async function editGrant(input: unknown): Promise<EditGrantResult> {
  const parsed = editGrantSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid grant details.", validationErrors(parsed.error));
  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.grant.findFirst({ where: { id: parsed.data.grantId, organizationId: authorization.organizationId, deletedAt: null, funder: { organizationId: authorization.organizationId, deletedAt: null } } });
    if (!existing) return null;
    if (parsed.data.funderId !== undefined) {
      const funder = await tx.funder.findFirst({ where: { id: parsed.data.funderId, organizationId: authorization.organizationId, deletedAt: null } });
      if (!funder) return null;
    }
    const { funderId, title, amountRequested, amountAwarded, deadline, decisionDate, awardTimeframe, designation, countyServed, nextSteps, notes } = parsed.data;
    const grant = await tx.grant.update({ where: { id: existing.id }, data: {
      ...(funderId !== undefined ? { funderId } : {}), ...(title !== undefined ? { title } : {}),
      ...(amountRequested !== undefined ? { amountRequested } : {}), ...(amountAwarded !== undefined ? { amountAwarded } : {}),
      ...(deadline !== undefined ? { deadline: dateValue(deadline) } : {}), ...(decisionDate !== undefined ? { decisionDate: dateValue(decisionDate) } : {}),
      ...(awardTimeframe !== undefined ? { awardTimeframe } : {}), ...(designation !== undefined ? { designation } : {}),
      ...(countyServed !== undefined ? { countyServed } : {}), ...(nextSteps !== undefined ? { nextSteps } : {}), ...(notes !== undefined ? { notes } : {}),
    }, select: grantSelect });
    const activity = await tx.activity.create({ data: { organizationId: authorization.organizationId, grantId: grant.id, action: "grant_updated", description: `Updated grant ${grant.title}.`, actorId: authorization.userId } });
    return { grant, activity };
  });
  if (!result) return invalid("Grant or funder not found.");
  revalidatePath("/grants");
  return { success: true, data: grantDto(result.grant, { id: result.activity.id, action: result.activity.action, description: result.activity.description, metadata: null, actorId: result.activity.actorId, createdAt: result.activity.createdAt.toISOString() }) };
}

export async function changeGrantStatus(input: unknown): Promise<ChangeGrantStatusResult> {
  const parsed = changeGrantStatusSchema.safeParse(input);
  if (!parsed.success) return invalid("Invalid grant status.", validationErrors(parsed.error));
  const authorization = await authorizeAction();
  if ("success" in authorization) return authorization;
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.grant.findFirst({ where: { id: parsed.data.grantId, organizationId: authorization.organizationId, deletedAt: null, funder: { organizationId: authorization.organizationId, deletedAt: null } }, select: grantSelect });
    const nextStatus = databaseStatus(parsed.data.status);
    if (!existing) return null;
    if (existing.status === nextStatus) return { grant: existing, activity: null };
    const grant = await tx.grant.update({ where: { id: parsed.data.grantId }, data: { status: nextStatus }, select: grantSelect });
    const activity = await tx.activity.create({ data: { organizationId: authorization.organizationId, grantId: grant.id, action: "status_changed", description: `Changed grant status to ${parsed.data.status}.`, actorId: authorization.userId, metadata: { previousStatus: existing.status, newStatus: nextStatus } } });
    return { grant, activity, previousStatus: existing.status };
  });
  if (!result) return invalid("Grant not found.");
  if (!result.activity) {
    return { success: true, data: grantDto(result.grant, null) };
  }
  revalidatePath("/grants");
  return { success: true, data: grantDto(result.grant, { id: result.activity.id, action: result.activity.action, description: result.activity.description, metadata: result.activity.metadata as Record<string, unknown> | null, actorId: result.activity.actorId, createdAt: result.activity.createdAt.toISOString() }) };
}
