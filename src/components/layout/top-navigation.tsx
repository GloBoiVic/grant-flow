import type { ReactNode } from "react";

import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { MobileNavigation } from "./mobile-navigation";

interface TopNavigationProps {
  identity: ShellIdentityDto;
  sidebarCollapsed: boolean;
  children?: ReactNode;
}

export function TopNavigation({ identity, sidebarCollapsed, children }: TopNavigationProps): ReactNode {
  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-30 flex h-(--layout-topnav-h) items-center justify-between border-b border-border bg-card px-3",
      sidebarCollapsed ? "lg:left-[var(--layout-sidebar-w-collapsed)]" : "lg:left-[var(--layout-sidebar-w)]",
    )}>
      <div className="flex min-w-0 items-center gap-2">
        <MobileNavigation organizationName={identity.organizationName} />
        {children ?? <span className="truncate text-sm font-medium">{identity.organizationName}</span>}
      </div>
      <AccountMenu identity={identity} />
    </header>
  );
}
