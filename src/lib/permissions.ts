import type { Role } from "./types";

/** Every gated section of the app. */
export type ModuleKey =
  | "dashboard"
  | "calendar"
  | "my_jobs"
  | "teams"
  | "clients"
  | "quotes"
  | "accounting"
  | "users";

export interface RoleMeta {
  label: string;
  description: string;
  colorKey: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    label: "Administración",
    description: "Acceso completo a toda la plataforma.",
    colorKey: "violet",
  },
  coordinator: {
    label: "Coordinación logística",
    description: "Organiza el calendario, asigna equipos y da seguimiento operativo.",
    colorKey: "sky",
  },
  supervisor: {
    label: "Supervisión",
    description: "Ve sus trabajos asignados, sube evidencia y confirma servicios.",
    colorKey: "lime",
  },
  finance: {
    label: "Finanzas",
    description: "Ingresos, gastos, cobros, pagos y reportes financieros.",
    colorKey: "orange",
  },
  sales: {
    label: "Ventas",
    description: "Leads, reuniones, cotizaciones y conversión a trabajos.",
    colorKey: "fuchsia",
  },
};

export const ROLES: Role[] = [
  "admin",
  "coordinator",
  "supervisor",
  "finance",
  "sales",
];

/** Default module access per role. Admin always has everything. */
export const DEFAULT_ACCESS: Record<Role, ModuleKey[]> = {
  admin: [
    "dashboard",
    "calendar",
    "my_jobs",
    "teams",
    "clients",
    "quotes",
    "accounting",
    "users",
  ],
  coordinator: ["dashboard", "calendar", "teams", "clients"],
  supervisor: ["my_jobs"],
  finance: ["dashboard", "accounting", "clients"],
  sales: ["dashboard", "quotes", "clients"],
};

export function canAccess(
  role: Role,
  access: Record<Role, ModuleKey[]>,
  key: ModuleKey,
): boolean {
  if (role === "admin") return true;
  return (access[role] ?? []).includes(key);
}
