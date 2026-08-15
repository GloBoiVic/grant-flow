import type { ReactNode } from "react";

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export default function FundersPage(): ReactNode {
  return (
    <FeaturePlaceholder
      title="Funders"
      description="Funder records and the grant history connected to them will be available here."
    />
  );
}
