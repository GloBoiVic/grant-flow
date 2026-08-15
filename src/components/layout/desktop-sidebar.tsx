"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavigationList } from "./navigation-list";

const SIDEBAR_STORAGE_KEY = "grantflow:sidebar-collapsed:v1";

interface DesktopSidebarProps {
  organizationName: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function DesktopSidebar({
  organizationName,
  collapsed,
  onCollapsedChange,
}: DesktopSidebarProps): React.ReactNode {
  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    let timeoutId: number | undefined;
    if (stored === "true" || stored === "false") {
      timeoutId = window.setTimeout(() => onCollapsedChange(stored === "true"), 0);
    }
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [onCollapsedChange]);

  function toggleCollapsed(): void {
    const nextValue = !collapsed;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    onCollapsedChange(nextValue);
  }

  return (
    <aside
      aria-label="Application sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar lg:flex",
        collapsed ? "w-[var(--layout-sidebar-w-collapsed)]" : "w-[var(--layout-sidebar-w)]",
        "transition-[width] duration-(--duration-slideover) ease-(--ease-slideover) motion-reduce:transition-none",
      )}
    >
      <div className="flex h-(--layout-topnav-h) items-center border-b border-sidebar-border px-4">
        <span className={cn("truncate text-brand text-sidebar-foreground", collapsed && "sr-only")}>
          GrantFlow
        </span>
        {collapsed && <span className="sr-only">GrantFlow</span>}
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col gap-6 p-3", collapsed && "items-center px-2")}>
        <p className={cn("truncate text-caption text-muted-foreground", collapsed && "sr-only")}>
          {organizationName}
        </p>
        <NavigationList collapsed={collapsed} className="w-full" />
      </div>
      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleCollapsed}
          className={cn("w-full justify-start text-muted-foreground", collapsed && "justify-center px-0")}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          <span className={cn(collapsed && "sr-only")}>{collapsed ? "Expand" : "Collapse"}</span>
        </Button>
      </div>
    </aside>
  );
}
