import type { ReactNode } from "react";

import { GrantsPage } from "@/components/grants/grants-page";
import { listFunders } from "@/lib/queries/funders";
import { getGrant, listGrants } from "@/lib/queries/grants";

interface GrantsRouteProps {
  searchParams?: Promise<{ cursor?: string; grant?: string; create?: string }>;
}

export default async function GrantsRoute({ searchParams }: GrantsRouteProps): Promise<ReactNode> {
  const params = (await searchParams) ?? {};
  const [grants, funders, selectedGrant] = await Promise.all([
    listGrants({ cursor: params.cursor }),
    listFunders(),
    params.grant ? getGrant(params.grant) : Promise.resolve(null),
  ]);

  return (
    <GrantsPage
      grants={grants}
      funders={funders.items}
      selectedGrant={selectedGrant}
      createOpen={params.create === "1"}
      cursor={params.cursor ?? null}
    />
  );
}
