import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

interface FeaturePlaceholderProps {
  title: string;
  description: string;
}

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps): ReactNode {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--layout-topnav-h))] w-full max-w-5xl items-start px-4 py-8 sm:px-6 lg:px-8">
      <section
        className="w-full rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
        aria-labelledby="feature-placeholder-title"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Planned</Badge>
        </div>
        <h1 id="feature-placeholder-title" className="mt-4 text-title text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-6 text-muted-foreground">
          {description}
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          This GrantFlow feature is planned and is not available yet.
        </p>
      </section>
    </div>
  );
}
