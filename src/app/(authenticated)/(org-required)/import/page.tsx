import type { ReactNode } from "react";

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export default function ImportPage(): ReactNode {
  return (
    <FeaturePlaceholder
      title="Import"
      description="You will be able to bring your existing grant tracker into GrantFlow here."
    />
  );
}
