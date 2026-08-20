import "server-only";

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { mapClerkRole } from "@/lib/clerk/roles";

const id = z.string().min(1);
const webhookTimestamp = z.union([
  z.number().int().nonnegative(),
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp"),
]).optional();
const eventAttributes = z.object({}).passthrough().optional();
const envelope = <T extends z.ZodType>(type: string, data: T) =>
  z.object({ type: z.literal(type), object: z.literal("event"), data, timestamp: webhookTimestamp, event_attributes: eventAttributes });

const user = z.object({
  id,
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  image_url: z.string(),
  email_addresses: z.array(z.object({ id, email_address: z.string().email() })),
  primary_email_address_id: id.nullable(),
  updated_at: webhookTimestamp,
});
const organization = z.object({
  id,
  name: z.string(),
  slug: z.string().min(1),
  created_by: id.nullable().optional(),
  updated_at: webhookTimestamp,
});
const membership = z.object({
  id,
  role: z.string(),
  updated_at: z.number().int().nonnegative().optional(),
  deleted_at: z.number().int().nonnegative().optional(),
  organization: organization,
  public_user_data: z.object({ user_id: id }),
});

const userWithUsablePrimaryEmail = user.superRefine((value, context) => {
  const primary = value.email_addresses.find((item) => item.id === value.primary_email_address_id);
  if (!primary) {
    context.addIssue({ code: "custom", message: "Clerk user has no usable primary email", path: ["primary_email_address_id"] });
  }
});
const deletedUser = z.object({ id, deleted_at: webhookTimestamp });

const schemas = {
  "user.created": envelope("user.created", userWithUsablePrimaryEmail),
  "user.updated": envelope("user.updated", userWithUsablePrimaryEmail),
  "user.deleted": envelope("user.deleted", deletedUser),
  "organization.created": envelope("organization.created", organization),
  "organization.updated": envelope("organization.updated", organization),
  "organizationMembership.created": envelope("organizationMembership.created", membership),
  "organizationMembership.updated": envelope("organizationMembership.updated", membership),
  "organizationMembership.deleted": envelope("organizationMembership.deleted", membership),
} as const;

export type SupportedWebhookType = keyof typeof schemas;
export type IdentityWebhookDb = Pick<PrismaClient, "user" | "organization" | "membership" | "organizationProvisioning" | "$transaction">;

export class MissingMembershipParentError extends Error {}
export class MalformedIdentityPayloadError extends Error {}
export class MembershipReconciliationUnavailableError extends Error {
  readonly retryable = true;
}
export type IdentityConflictCode = "SECOND_MEMBERSHIP" | "UNCLAIMED_MEMBERSHIP";
export class IdentityConflictError extends Error {
  readonly code: IdentityConflictCode;
  constructor(code: IdentityConflictCode) {
    super("Identity conflict");
    this.name = "IdentityConflictError";
    this.code = code;
  }
}

export function parseClerkWebhook(value: unknown): unknown | null {
  if (!value || typeof value !== "object" || !("type" in value)) throw new Error("Malformed webhook");
  const type = (value as { type?: unknown }).type;
  if (typeof type !== "string" || !(type in schemas)) return null;
  return schemas[type as SupportedWebhookType].parse(value);
}

function userFields(data: z.infer<typeof user>) {
  const email = data.email_addresses.find((item) => item.id === data.primary_email_address_id)?.email_address;
  if (!email) throw new MalformedIdentityPayloadError("Clerk user has no usable primary email");
  return {
    email,
    name: [data.first_name, data.last_name].filter(Boolean).join(" ") || email,
    avatarUrl: data.image_url || null,
  };
}

function eventVersion(value: unknown, data: unknown): Date {
  const envelope = value as { timestamp?: unknown };
  const payload = data as { updated_at?: unknown; deleted_at?: unknown };
  const raw = payload.deleted_at ?? payload.updated_at ?? envelope.timestamp;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw < 10_000_000_000 ? raw * 1000 : raw);
  }
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return new Date();
}

function monotonicDate(current: Date | null | undefined, incoming: Date): Date {
  return current && current > incoming ? current : incoming;
}

async function processMembership(
  db: IdentityWebhookDb,
  data: z.infer<typeof membership>,
  deleting: boolean,
  version: Date,
) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let conflictCode: IdentityConflictCode | undefined;
    try {
      await db.$transaction(async (tx) => {
        const [localUser, localOrg] = await Promise.all([
          tx.user.findUnique({ where: { clerkUserId: data.public_user_data.user_id }, select: { id: true, tenantIsolationLockedAt: true } }),
          tx.organization.findUnique({ where: { clerkOrgId: data.organization.id }, select: { id: true } }),
        ]);
        if (!localUser || !localOrg) throw new MissingMembershipParentError();
        const where = { userId: localUser.id };
        const local = await tx.membership.findUnique({
          where,
           select: { organizationId: true, clerkMembershipId: true, clerkDeletedAt: true, clerkRoleUpdatedAt: true },
        });

        if (local) {
          if (local.organizationId !== localOrg.id || local.clerkMembershipId !== data.id) {
            if (!localUser.tenantIsolationLockedAt || localUser.tenantIsolationLockedAt < version) {
              await tx.user.update({ where: { id: localUser.id }, data: { tenantIsolationLockedAt: monotonicDate(localUser.tenantIsolationLockedAt, version) } });
            }
            conflictCode = "SECOND_MEMBERSHIP";
            return;
          }
          // Revocation is monotonic. Delayed create/update notifications cannot
          // reanimate the original incarnation.
          if (local.clerkDeletedAt) return;
          if (deleting) {
            await tx.membership.update({ where, data: { clerkDeletedAt: monotonicDate(local.clerkDeletedAt, version) } });
           } else {
             if (local.clerkRoleUpdatedAt && local.clerkRoleUpdatedAt >= version) return;
            const role = mapClerkRole(data.role);
            await tx.membership.update({ where, data: role === null
              ? { role: null, roleSyncStatus: "UNKNOWN", clerkRoleUpdatedAt: version }
              : { role, roleSyncStatus: "KNOWN", clerkRoleUpdatedAt: version } });
          }
          return;
        }

        const claim = await tx.organizationProvisioning.findUnique({
          where: { userId: localUser.id },
          select: { status: true, clerkOrgId: true },
        });
        if (!claim || claim.status !== "PENDING" || claim.clerkOrgId !== data.organization.id || deleting) {
          if (!localUser.tenantIsolationLockedAt || localUser.tenantIsolationLockedAt < version) {
            await tx.user.update({ where: { id: localUser.id }, data: { tenantIsolationLockedAt: monotonicDate(localUser.tenantIsolationLockedAt, version) } });
          }
          conflictCode = "UNCLAIMED_MEMBERSHIP";
          return;
        }
         const role = mapClerkRole(data.role);
         // The first-org flow is creator-owned: Clerk must verify the creator
         // as ADMIN before the local binding can be activated.
         if (role !== "ADMIN") {
          await tx.user.update({ where: { id: localUser.id }, data: { tenantIsolationLockedAt: monotonicDate(localUser.tenantIsolationLockedAt, version) } });
          conflictCode = "UNCLAIMED_MEMBERSHIP";
          return;
        }
        await tx.membership.create({ data: {
          organizationId: localOrg.id,
          userId: localUser.id,
          clerkMembershipId: data.id,
          role,
        } });
        await tx.organizationProvisioning.update({ where: { userId: localUser.id }, data: { status: "COMPLETED" } });
      }, { isolationLevel: "Serializable" });
      if (conflictCode) throw new IdentityConflictError(conflictCode);
      return;
    } catch (error) {
      if (isSerializationConflict(error) && attempt < maxAttempts) continue;
      if (error instanceof MissingMembershipParentError || error instanceof MembershipReconciliationUnavailableError || error instanceof IdentityConflictError) throw error;
      throw new MembershipReconciliationUnavailableError("Membership reconciliation unavailable", { cause: error });
    }
  }
}

function isSerializationConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2034";
}

export type WebhookResult = { status: "applied" | "ignored" | "conflict"; code?: IdentityConflictCode };

export async function processClerkWebhook(
  db: IdentityWebhookDb,
  value: unknown,
): Promise<WebhookResult> {
  const parsedValue = parseClerkWebhook(value);
  if (parsedValue === null) return { status: "ignored" };
  value = parsedValue;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== "string" || !(type in schemas)) return { status: "ignored" };
  const supportedType = type as SupportedWebhookType;
  if (type === "user.created" || type === "user.updated") {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["user.created"]>).data;
    await db.user.upsert({ where: { clerkUserId: data.id }, update: userFields(data), create: { clerkUserId: data.id, ...userFields(data) } });
  } else if (type === "user.deleted") {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["user.deleted"]>).data;
     const version = eventVersion(value, data);
     const current = await db.user.findUnique({ where: { clerkUserId: data.id }, select: { clerkDeletedAt: true } });
     if (!current?.clerkDeletedAt || current.clerkDeletedAt < version) {
       await db.user.update({ where: { clerkUserId: data.id }, data: { clerkDeletedAt: version } });
     }
  } else if (type === "organization.created" || type === "organization.updated") {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["organization.created"]>).data;
    await db.$transaction(async (tx) => {
      const organization = await tx.organization.upsert({ where: { clerkOrgId: data.id }, update: { name: data.name, slug: data.slug }, create: { clerkOrgId: data.id, name: data.name, slug: data.slug } });
      if (data.created_by) {
        const creator = await tx.user.findUnique({ where: { clerkUserId: data.created_by }, select: { id: true, clerkDeletedAt: true, tenantIsolationLockedAt: true, membership: { select: { id: true } } } });
        if (!creator) throw new MissingMembershipParentError();
        if (!creator.clerkDeletedAt && !creator.tenantIsolationLockedAt && !creator.membership) {
          await tx.organization.update({ where: { id: organization.id }, data: { creatorId: creator.id } });
           const claim = await tx.organizationProvisioning.findUnique({
             where: { userId: creator.id },
             select: { status: true, clerkOrgId: true },
           });
           if (claim?.status === "PENDING" && !claim.clerkOrgId) {
             await tx.organizationProvisioning.update({
               where: { userId: creator.id },
               data: { clerkOrgId: data.id },
             });
           }
        }
      }
    });
  } else {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["organizationMembership.created"]>).data;
    try {
      await processMembership(db, data, type === "organizationMembership.deleted", eventVersion(value, data));
    } catch (error) {
      if (error instanceof IdentityConflictError) return { status: "conflict", code: error.code };
      throw error;
    }
  }
  return { status: "applied" };
}
