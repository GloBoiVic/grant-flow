import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { GrantsPage } from "@/components/grants/grants-page";
import { listFunders } from "@/lib/queries/funders";
import { getGrant, listGrants } from "@/lib/queries/grants";
import { listTags } from "@/lib/queries/tags";
import { grantListSearchParams, normalizeGrantListUrl, type GrantListUrlInput } from "@/lib/queries/grant-list-contract";

interface GrantsRouteProps {
  searchParams?: Promise<GrantListUrlInput & { grant?: string; create?: string }>;
}

export default async function GrantsRoute({ searchParams }: GrantsRouteProps): Promise<ReactNode> {
  const params = (await searchParams) ?? {};
  const [funders, tags] = await Promise.all([listFunders(), listTags()]);
  const query = normalizeGrantListUrl(params, tags.items.map((tag) => tag.id));
  const grants = await listGrants(query);
  if (query.page > 1 && grants.items.length === 0) {
    const firstPage = grantListSearchParams({ ...query, page: 1 });
    const preserved = new URLSearchParams(firstPage);
    if (params.grant) preserved.set("grant", params.grant);
    if (params.create === "1") preserved.set("create", "1");
    redirect(`/grants${preserved.toString() ? `?${preserved.toString()}` : ""}`);
  }
  const selectedGrant = params.grant ? await getGrant(params.grant) : null;

  return (
    <GrantsPage
      grants={grants}
      funders={funders.items}
      selectedGrant={selectedGrant}
      tags={tags.items}
      createOpen={params.create === "1"}
      listQuery={grantListSearchParams(query)}
    />
  );
}
