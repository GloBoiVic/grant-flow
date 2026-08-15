import type { ReactNode } from "react";

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export default function GrantsPage(): ReactNode {
  return (
    <FeaturePlaceholder
      title="Grants"
      description="Grant tracking will help you organize opportunities, stages, deadlines, owners, and related documents here."
    />
  );
}
