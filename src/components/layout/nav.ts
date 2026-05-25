import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
  /** shown in the mobile bottom tab bar */
  primary: boolean;
  /** which live counter (if any) drives the badge */
  badge?: "unassigned" | "pendingDigit";
}

export const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Overview",
    primary: true,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    group: "Operations",
    primary: true,
    badge: "unassigned",
  },
  {
    href: "/quotes",
    label: "Quotes",
    icon: FileText,
    group: "Operations",
    primary: true,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Building2,
    group: "Operations",
    primary: true,
  },
  {
    href: "/teams",
    label: "Teams",
    icon: Users,
    group: "Operations",
    primary: false,
  },
  {
    href: "/accounting",
    label: "Accounting",
    icon: Wallet,
    group: "Finance",
    primary: true,
    badge: "pendingDigit",
  },
];

export const NAV_GROUPS = ["Overview", "Operations", "Finance"];
