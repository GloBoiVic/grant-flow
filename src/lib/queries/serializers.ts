import "server-only";

import type { ActivityDto } from "@/types/grant";

export function serializeDate(value: Date | null): string | null {
  return value === null ? null : value.toISOString().slice(0, 10);
}

export function serializeTimestamp(value: Date): string {
  return value.toISOString();
}

export function serializeMetadata(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function serializeActivity(activity: {
  id: string;
  action: string;
  description: string;
  metadata: unknown;
  actorId: string | null;
  createdAt: Date;
}): ActivityDto {
  return {
    id: activity.id,
    action: activity.action,
    description: activity.description,
    metadata: serializeMetadata(activity.metadata),
    actorId: activity.actorId,
    createdAt: serializeTimestamp(activity.createdAt),
  };
}
