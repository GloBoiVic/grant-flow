"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation-config";

interface NavigationListProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationList({
  collapsed = false,
  onNavigate,
  className,
}: NavigationListProps): React.ReactNode {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className={cn("flex flex-col gap-1", className)}>
      {navigationItems.map(({ href, icon: Icon, label }) => {
        const current = isCurrentPath(pathname, href);
        const linkProps: ComponentProps<typeof Link> = { href };

        return (
          <Link
            key={href}
            {...linkProps}
            aria-current={current ? "page" : undefined}
            aria-label={collapsed ? label : undefined}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center px-0",
              current && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
