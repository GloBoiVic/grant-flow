import type { FunderType } from "@/lib/validations/funder";
import type { ActionResult } from "@/types/common";

export interface FunderDto {
  id: string;
  name: string;
  type: FunderType;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FunderListDto {
  items: FunderDto[];
}

export type CreateFunderResult = ActionResult<FunderDto>;
export type ListFunderResult = ActionResult<FunderListDto>;
