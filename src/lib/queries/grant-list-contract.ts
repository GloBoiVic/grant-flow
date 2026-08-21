import { GrantStatus, type GrantStatus as GrantStatusValue } from "@/lib/validations/grant";
import type { GrantStatus as PrismaGrantStatus } from "@/generated/prisma/enums";

export const GRANT_LIST_PAGE_SIZE = 50;
export const DEFAULT_GRANT_SORT = "deadline" as const;
export const DEFAULT_GRANT_DIRECTION = "asc" as const;

export const grantSortFields = ["title", "funder", "status", "deadline", "requested", "awarded"] as const;
export type GrantSortField = (typeof grantSortFields)[number];
export type GrantSortDirection = "asc" | "desc";

export interface GrantListUrlInput {
  q?: string | string[];
  status?: string | string[];
  tag?: string | string[];
  sort?: string;
  dir?: string;
  page?: string;
}

export interface GrantListQueryOptions {
  q?: string;
  statuses: GrantStatusValue[];
  tagIds: string[];
  sort: GrantSortField;
  direction: GrantSortDirection;
  page: number;
}

const statusValues = new Set<string>(Object.values(GrantStatus));
const prismaStatusByLabel: Record<GrantStatusValue, PrismaGrantStatus> = {
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

function values(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function first(value: string | string[] | undefined): string | undefined {
  return values(value)[0];
}

function normalizePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10_000);
}

export function normalizeGrantListUrl(input: GrantListUrlInput, activeTagIds: Iterable<string> = []): GrantListQueryOptions {
  const query = first(input.q)?.trim().slice(0, 100) ?? "";
  const statuses = [...new Set(values(input.status).filter((status): status is GrantStatusValue => statusValues.has(status)))];
  const activeTags = new Set(activeTagIds);
  const tagIds = [...new Set(values(input.tag).filter((tagId) => activeTags.has(tagId)))];
  const sort = grantSortFields.includes(input.sort as GrantSortField) ? input.sort as GrantSortField : DEFAULT_GRANT_SORT;
  const direction: GrantSortDirection = input.dir === "desc" ? "desc" : DEFAULT_GRANT_DIRECTION;

  return { q: query || undefined, statuses, tagIds, sort, direction, page: normalizePage(input.page) };
}

export function toPrismaStatuses(statuses: GrantStatusValue[]): PrismaGrantStatus[] {
  return statuses.map((status) => prismaStatusByLabel[status]);
}

export function grantListSearchParams(options: GrantListQueryOptions): string {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  options.statuses.forEach((status) => params.append("status", status));
  options.tagIds.forEach((tagId) => params.append("tag", tagId));
  if (options.sort !== DEFAULT_GRANT_SORT) params.set("sort", options.sort);
  if (options.direction !== DEFAULT_GRANT_DIRECTION) params.set("dir", options.direction);
  if (options.page > 1) params.set("page", String(options.page));
  return params.toString();
}
