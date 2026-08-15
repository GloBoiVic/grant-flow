"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import type { ShellIdentityDto } from "@/lib/queries/shell-identity";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "./desktop-sidebar";
import { TopNavigation } from "./top-navigation";

interface AppShellProps {
  identity: ShellIdentityDto;
  children: ReactNode;
}

export function AppShell({ identity, children }: AppShellProps): ReactNode {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleCollapsedChange = useCallback((collapsed: boolean): void => {
    setSidebarCollapsed(collapsed);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground">
        Skip to main content
      </a>
      <DesktopSidebar
        organizationName={identity.organizationName}
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleCollapsedChange}
      />
      <TopNavigation identity={identity} sidebarCollapsed={sidebarCollapsed} />
      <main id="main-content" className={cn(
        "min-h-screen pt-(--layout-topnav-h)",
        sidebarCollapsed ? "lg:ml-[var(--layout-sidebar-w-collapsed)]" : "lg:ml-[var(--layout-sidebar-w)]",
      )}>
        {children}
      </main>
    </div>
  );
}
