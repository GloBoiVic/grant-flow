import type { GrantStatus } from "@/lib/validations/grant";
import type { ActionResult } from "@/types/common";
import type { FunderDto } from "@/types/funder";

export interface ActivityDto {
  id: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  actorId: string | null;
  createdAt: string;
}

export interface GrantDto {
  id: string;
  funderId: string;
  title: string;
  status: GrantStatus;
  currency: string;
  amountRequested: string | null;
  amountAwarded: string | null;
  deadline: string | null;
  decisionDate: string | null;
  awardTimeframe: string | null;
  designation: string | null;
  countyServed: string | null;
  nextSteps: string | null;
  notes: string | null;
  ownerId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrantListItemDto extends GrantDto {
  funder: Pick<FunderDto, "id" | "name" | "type">;
}

export interface GrantDetailDto extends GrantDto {
  funder: FunderDto;
  activities: ActivityDto[];
}

export interface GrantListDto {
  items: GrantListItemDto[];
  nextCursor: string | null;
}

export type CreateGrantResult = ActionResult<GrantDetailDto>;
export type EditGrantResult = ActionResult<GrantDetailDto>;
export type ChangeGrantStatusResult = ActionResult<GrantDetailDto>;
export type ListGrantResult = ActionResult<GrantListDto>;
export type GetGrantResult = ActionResult<GrantDetailDto>;
