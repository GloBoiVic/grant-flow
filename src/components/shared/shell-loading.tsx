import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function ShellLoading(): ReactNode {
  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading GrantFlow"
      aria-busy="true"
    >
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-8 w-2/3 max-w-md" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-5/6 max-w-xl" />
      </div>
      <span className="sr-only">Loading content</span>
    </div>
  );
}
