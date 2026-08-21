"use client";

import { Button } from "@/components/ui/button";

interface FundersErrorProps { reset: () => void; }

export default function FundersError({ reset }: FundersErrorProps): React.ReactNode {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm" role="alert" aria-labelledby="funders-error-title">
        <h1 id="funders-error-title" className="text-title text-foreground">We couldn&apos;t load funders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again to load the funder list.</p>
        <Button type="button" className="mt-5" onClick={reset}>Try again</Button>
      </section>
    </div>
  );
}
