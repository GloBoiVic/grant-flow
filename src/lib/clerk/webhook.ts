import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { mapClerkRole } from "@/lib/clerk/roles";

const id = z.string().min(1);
const eventAttributes = z.object({}).passthrough().optional();
const envelope = <T extends z.ZodType>(type: string, data: T) =>
  z.object({ type: z.literal(type), object: z.literal("event"), data, event_attributes: eventAttributes });

const user = z.object({
  id,
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  image_url: z.string(),
  email_addresses: z.array(z.object({ id, email_address: z.string().email() })),
  primary_email_address_id: id.nullable(),
});
const organization = z.object({ id, name: z.string(), slug: z.string().min(1) });
const membership = z.object({
  id,
  role: z.string(),
  organization: organization,
  public_user_data: z.object({ user_id: id }),
});

const userWithUsablePrimaryEmail = user.superRefine((value, context) => {
  const primary = value.email_addresses.find((item) => item.id === value.primary_email_address_id);
  if (!primary) {
    context.addIssue({ code: "custom", message: "Clerk user has no usable primary email", path: ["primary_email_address_id"] });
  }
});

const schemas = {
  "user.created": envelope("user.created", userWithUsablePrimaryEmail),
  "user.updated": envelope("user.updated", userWithUsablePrimaryEmail),
  "organization.created": envelope("organization.created", organization),
  "organization.updated": envelope("organization.updated", organization),
  "organizationMembership.created": envelope("organizationMembership.created", membership),
  "organizationMembership.updated": envelope("organizationMembership.updated", membership),
  "organizationMembership.deleted": envelope("organizationMembership.deleted", membership),
} as const;

export type SupportedWebhookType = keyof typeof schemas;
export type IdentityWebhookDb = Pick<PrismaClient, "user" | "organization" | "membership" | "$transaction">;

export class MissingMembershipParentError extends Error {}
export class MalformedIdentityPayloadError extends Error {}
export class MembershipReconciliationUnavailableError extends Error {
  readonly retryable = true;
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

async function processMembership(
  db: IdentityWebhookDb,
  data: z.infer<typeof membership>,
  deleting: boolean,
  getCurrentMembership: CurrentMembershipReader,
) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await db.$transaction(async (tx) => {
        const [localUser, localOrg] = await Promise.all([
          tx.user.findUnique({ where: { clerkUserId: data.public_user_data.user_id }, select: { id: true } }),
          tx.organization.findUnique({ where: { clerkOrgId: data.organization.id }, select: { id: true } }),
        ]);
        if (!localUser || !localOrg) throw new MissingMembershipParentError();
        const where = { organizationId_userId: { organizationId: localOrg.id, userId: localUser.id } };
        const current = await getCurrentMembership(data.organization.id, data.public_user_data.user_id);
        const local = await tx.membership.findUnique({ where, select: { clerkMembershipId: true } });

        if (!current) {
          if (local?.clerkMembershipId === null && deleting) throw new MembershipReconciliationUnavailableError();
          if (deleting && local?.clerkMembershipId === data.id) {
            await tx.membership.deleteMany({ where: { organizationId: localOrg.id, userId: localUser.id, clerkMembershipId: data.id } });
          }
          return;
        }

        // Clerk is authoritative whenever a current membership exists, including
        // when its id matches the event being processed. A delete event can be
        // stale, so reconcile the live membership and never delete it.
        await tx.membership.upsert({ where, update: { clerkMembershipId: current.id, role: mapClerkRole(current.role) }, create: {
          organizationId: localOrg.id, userId: localUser.id, clerkMembershipId: current.id, role: mapClerkRole(current.role),
        } });
      }, { isolationLevel: "Serializable" });
      return;
    } catch (error) {
      if (isSerializationConflict(error) && attempt < maxAttempts) continue;
      if (error instanceof MissingMembershipParentError || error instanceof MembershipReconciliationUnavailableError) throw error;
      throw new MembershipReconciliationUnavailableError("Membership reconciliation unavailable", { cause: error });
    }
  }
}

function isSerializationConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2034";
}

type CurrentMembership = { id: string; role: string };
export type CurrentMembershipReader = (organizationId: string, userId: string) => Promise<CurrentMembership | null>;

const readCurrentMembership: CurrentMembershipReader = async (organizationId, userId) => {
  const current = await (await clerkClient()).organizations.getOrganizationMembershipList({
    organizationId,
    userId: [userId],
    limit: 1,
  });
  const item = current.data.find((candidate) => candidate.publicUserData?.userId === userId);
  return item ? { id: item.id, role: item.role } : null;
};

export async function processClerkWebhook(
  db: IdentityWebhookDb,
  value: unknown,
  dependencies: { getCurrentMembership?: CurrentMembershipReader } = {},
): Promise<void> {
  const parsedValue = parseClerkWebhook(value);
  if (parsedValue === null) return;
  value = parsedValue;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== "string" || !(type in schemas)) return;
  const supportedType = type as SupportedWebhookType;
  if (type === "user.created" || type === "user.updated") {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["user.created"]>).data;
    await db.user.upsert({ where: { clerkUserId: data.id }, update: userFields(data), create: { clerkUserId: data.id, ...userFields(data) } });
  } else if (type === "organization.created" || type === "organization.updated") {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["organization.created"]>).data;
    await db.organization.upsert({ where: { clerkOrgId: data.id }, update: { name: data.name, slug: data.slug }, create: { clerkOrgId: data.id, name: data.name, slug: data.slug } });
  } else {
    const data = (schemas[supportedType].parse(value) as z.infer<typeof schemas["organizationMembership.created"]>).data;
    await processMembership(db, data, type === "organizationMembership.deleted", dependencies.getCurrentMembership ?? readCurrentMembership);
  }
}
