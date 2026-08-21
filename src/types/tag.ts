import type { ActionResult } from "@/types/common";

export interface TagDto {
  id: string;
  name: string;
}

export interface TagListDto {
  items: TagDto[];
}

export type CreateTagResult = ActionResult<TagDto>;
export type AssignTagResult = ActionResult<TagDto[]>;
export type RemoveTagResult = ActionResult<TagDto[]>;
