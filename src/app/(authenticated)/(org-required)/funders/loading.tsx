import { Skeleton } from "@/components/ui/skeleton";

export default function FundersLoading(): React.ReactNode {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8" role="status" aria-label="Loading funders" aria-busy="true">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card p-4"><Skeleton className="h-8 w-full" /><Skeleton className="mt-4 h-11 w-full" /><Skeleton className="mt-2 h-11 w-full" /><Skeleton className="mt-2 h-11 w-full" /></div>
      <span className="sr-only">Loading funder list</span>
    </div>
  );
}
