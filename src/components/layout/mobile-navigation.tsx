"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavigationList } from "./navigation-list";

interface MobileNavigationProps {
  organizationName: string;
}

export function MobileNavigation({
  organizationName,
}: MobileNavigationProps): React.ReactNode {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent): void => {
      if (event.matches) setOpen(false);
    };
    mediaQuery.addEventListener("change", closeOnDesktop);
    return () => mediaQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-(--layout-sidebar-w) p-0">
          <SheetHeader className="border-b border-sidebar-border px-4 py-3">
            <SheetTitle className="text-brand">GrantFlow</SheetTitle>
            <SheetDescription className="truncate text-caption">{organizationName}</SheetDescription>
          </SheetHeader>
          <div className="p-3">
            <NavigationList onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
