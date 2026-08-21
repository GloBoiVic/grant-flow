import "server-only";

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

const id = z.string().min(1);
const envelope = <T extends z.ZodType>(type: string, data: T) => z.object({ type: z.literal(type), object: z.literal("event"), data });
const user = z.object({
  id,
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  image_url: z.string().nullable().optional(),
  email_addresses: z.array(z.object({ id, email_address: z.string().email() })),
  primary_email_address_id: id.nullable(),
});
const organization = z.object({
  id,
  name: z.string(),
  slug: z.string().min(1),
  created_by: id.optional(),
  private_metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});
const schemas = {
  "user.created": envelope("user.created", user),
  "user.updated": envelope("user.updated", user),
  "organization.created": envelope("organization.created", organization),
  "organization.updated": envelope("organization.updated", organization),
} as const;

export type IdentityWebhookDb = Pick<PrismaClient, "user" | "organization" | "$transaction">;
export type SupportedWebhookType = keyof typeof schemas;

export class MalformedWebhookError extends Error {
  constructor(message = "Malformed webhook") {
    super(message);
    this.name = "MalformedWebhookError";
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
  if (!email) throw new MalformedWebhookError("Malformed user projection");
  return { email, name: [data.first_name, data.last_name].filter(Boolean).join(" ") || email, avatarUrl: data.image_url || null };
}

export async function processClerkWebhook(db: IdentityWebhookDb, value: unknown): Promise<{ status: "applied" | "ignored" }> {
  const parsed = parseClerkWebhook(value);
  if (parsed === null) return { status: "ignored" };
  const type = (parsed as { type: SupportedWebhookType }).type;
  await db.$transaction(async (tx) => {
    const data = (parsed as { data: unknown }).data;
    if (type === "user.created" || type === "user.updated") {
      const payload = data as z.infer<typeof user>;
      await tx.user.upsert({ where: { clerkUserId: payload.id }, update: userFields(payload), create: { clerkUserId: payload.id, ...userFields(payload) } });
    } else {
      const payload = data as z.infer<typeof organization>;
      await tx.organization.upsert({ where: { clerkOrgId: payload.id }, update: { name: payload.name, slug: payload.slug }, create: { clerkOrgId: payload.id, name: payload.name, slug: payload.slug } });
    }
  });
  return { status: "applied" };
}
