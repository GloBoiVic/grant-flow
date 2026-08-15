"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface OrganizationRequiredErrorProps {
  reset: () => void;
}

export default function OrganizationRequiredError({ reset }: OrganizationRequiredErrorProps): ReactNode {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--layout-topnav-h))] w-full max-w-5xl items-start px-4 py-8 sm:px-6 lg:px-8">
      <section
        className="w-full rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
        role="alert"
        aria-labelledby="shell-error-title"
      >
        <p className="text-label text-muted-foreground">GrantFlow</p>
        <h1 id="shell-error-title" className="mt-2 text-title text-foreground">
          We couldn&apos;t load this page
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-6 text-muted-foreground">
          Something went wrong while loading this workspace. Try again to continue.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          Try again
        </Button>
      </section>
    </div>
  );
}
