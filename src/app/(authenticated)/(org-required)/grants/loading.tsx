import { Skeleton } from "@/components/ui/skeleton";

export default function Loading(): React.ReactNode {
  return <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8" aria-label="Loading grants" role="status"><Skeleton className="h-7 w-24" /><Skeleton className="mt-8 h-12 w-full" /><Skeleton className="mt-2 h-11 w-full" /><Skeleton className="mt-2 h-11 w-full" /><Skeleton className="mt-2 h-11 w-full" /></div>;
}
