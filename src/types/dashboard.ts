import type { GrantStatus } from "@/lib/validations/grant";

export interface DashboardDto {
  asOf: string;
  totals: {
    trackedGrants: number;
    openPipeline: number;
    requestedTotal: string;
    awardedTotal: string;
    currency: string;
  };
  attention: {
    overdueCount: number;
    dueIn7Count: number;
    oldestOverdueDays: number | null;
  };
  upcoming: Array<{
    id: string;
    title: string;
    funderName: string;
    deadline: string;
    status: GrantStatus;
  }>;
  breakdown: Array<{
    status: GrantStatus;
    count: number;
  }>;
}
