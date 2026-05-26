import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/permissions";

export interface ModuleItem {
  key: ModuleKey;
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
  badge?: "unassigned" | "pendingDigit";
}

export const MODULES: ModuleItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
    group: "General",
  },
  {
    key: "calendar",
    href: "/calendar",
    label: "Calendario",
    icon: CalendarDays,
    group: "Operaciones",
    badge: "unassigned",
  },
  {
    key: "my_jobs",
    href: "/my-jobs",
    label: "Mis trabajos",
    icon: ClipboardList,
    group: "Operaciones",
  },
  {
    key: "teams",
    href: "/teams",
    label: "Equipos",
    icon: Users,
    group: "Operaciones",
  },
  {
    key: "clients",
    href: "/clients",
    label: "Clientes",
    icon: Building2,
    group: "Comercial",
  },
  {
    key: "quotes",
    href: "/quotes",
    label: "Cotizaciones",
    icon: FileText,
    group: "Comercial",
  },
  {
    key: "accounting",
    href: "/accounting",
    label: "Contabilidad",
    icon: Wallet,
    group: "Finanzas",
    badge: "pendingDigit",
  },
  {
    key: "users",
    href: "/users",
    label: "Usuarios",
    icon: ShieldCheck,
    group: "Administración",
  },
];

export const NAV_GROUPS = [
  "General",
  "Operaciones",
  "Comercial",
  "Finanzas",
  "Administración",
];

/** First accessible href for a set of module keys, honoring nav order. */
export function defaultHrefFor(accessibleKeys: ModuleKey[]): string {
  const found = MODULES.find((m) => accessibleKeys.includes(m.key));
  return found?.href ?? "/dashboard";
}
