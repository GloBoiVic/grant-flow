import type { ReactNode } from "react";

import { requireAuthorizationOrRedirect } from "@/lib/clerk/authorization";
import { getShellIdentity } from "@/lib/queries/shell-identity";
import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
import { AppShell } from "@/components/layout/app-shell";

interface OrganizationRequiredLayoutProps { children: ReactNode; }

export default async function OrganizationRequiredLayout({ children }: OrganizationRequiredLayoutProps): Promise<ReactNode> {
  const authorization = await requireAuthorizationOrRedirect();
  const identity: ShellIdentityDto = await getShellIdentity(authorization);
  return <AppShell identity={identity}>{children}</AppShell>;
}
