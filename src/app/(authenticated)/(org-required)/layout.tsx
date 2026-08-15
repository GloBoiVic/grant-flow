import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireAuthorizationOrRedirect } from "@/lib/clerk/authorization";
import {
  getShellIdentity,
  ShellIdentityProjectionMissingError,
} from "@/lib/queries/shell-identity";
import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
import { AppShell } from "@/components/layout/app-shell";

interface OrganizationRequiredLayoutProps { children: ReactNode; }

export default async function OrganizationRequiredLayout({ children }: OrganizationRequiredLayoutProps): Promise<ReactNode> {
  const authorization = await requireAuthorizationOrRedirect();
  let identity: ShellIdentityDto;
  try {
    identity = await getShellIdentity(authorization);
  } catch (error) {
    if (error instanceof ShellIdentityProjectionMissingError) {
      redirect("/access");
    }
    throw error;
  }
  return <AppShell identity={identity}>{children}</AppShell>;
}
