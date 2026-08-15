import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Upload,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Grants", href: "/grants", icon: FileText },
  { label: "Funders", href: "/funders", icon: Building2 },
  { label: "Deadlines", href: "/deadlines", icon: CalendarDays },
  { label: "Import", href: "/import", icon: Upload },
] as const satisfies readonly NavigationItem[];
