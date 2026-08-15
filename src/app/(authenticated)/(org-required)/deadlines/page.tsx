import type { ReactNode } from "react";

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export default function DeadlinesPage(): ReactNode {
  return (
    <FeaturePlaceholder
      title="Deadlines"
      description="A focused view of upcoming grant deadlines and the work that needs attention will be available here."
    />
  );
}
