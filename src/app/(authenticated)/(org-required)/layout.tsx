import type { ReactNode } from "react";

import { requireAuthorizationOrRedirect } from "@/lib/clerk/authorization";

interface OrganizationRequiredLayoutProps { children: ReactNode; }

export default async function OrganizationRequiredLayout({ children }: OrganizationRequiredLayoutProps): Promise<ReactNode> {
  await requireAuthorizationOrRedirect();
  return children;
}
