import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { GrantWorkspace } from "@/components/grants/grant-workspace";
import { listFunders } from "@/lib/queries/funders";
import { getGrant } from "@/lib/queries/grants";
import { listTags } from "@/lib/queries/tags";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface GrantWorkspaceRouteProps {
  params: Promise<{ grantId: string }>;
}

export default async function GrantWorkspaceRoute({ params }: GrantWorkspaceRouteProps): Promise<ReactNode> {
  const { grantId } = await params;
  if (!uuidPattern.test(grantId)) notFound();

  const grant = await getGrant(grantId);
  if (!grant) notFound();

  const [funders, tags] = await Promise.all([listFunders(), listTags()]);

  return <GrantWorkspace grant={grant} funders={funders.items} tags={tags.items} />;
}
