import type { GrantStatus } from "@/lib/validations/grant";

export interface DeadlineItem {
  id: string;
  title: string;
  funderName: string;
  deadline: string;
  status: GrantStatus;
}

export interface DeadlineViewDto {
  asOf: string;
  trackedGrantCount: number;
  groups: {
    overdue: DeadlineItem[];
    dueSoon: DeadlineItem[];
    later: DeadlineItem[];
  };
}
