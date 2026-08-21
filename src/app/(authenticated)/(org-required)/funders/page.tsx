import type { ReactNode } from "react";

import { FunderPage } from "@/components/funders/funder-page";
import { listFunders } from "@/lib/queries/funders";

export default async function FundersPage(): Promise<ReactNode> {
  const funders = await listFunders();
  return <FunderPage funders={funders.items} />;
}
