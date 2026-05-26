/**
 * BrilloSoft domain model.
 *
 * This is the single source of truth for entity shapes. The local store
 * (src/lib/store.ts) persists these to localStorage today; the same shapes
 * map 1:1 to Supabase tables when the backend is wired up later.
 */

export type ID = string;

export type Role = "admin" | "coordinator" | "supervisor" | "finance" | "sales";

export interface User {
  id: ID;
  name: string;
  role: Role;
  email?: string;
  /** key into TEAM_PALETTE for the avatar color */
  colorKey: string;
  /** supervisors are tied to the crew they run */
  teamId?: ID;
}

/* ------------------------------ Teams ------------------------------ */

export interface Team {
  id: ID;
  name: string;
  /** key into TEAM_PALETTE (src/lib/colors.ts) */
  colorKey: string;
  members: string[];
  active: boolean;
  createdAt: string;
}

/* --------------------------- Recurrence --------------------------- */

export type Frequency = "weekly" | "biweekly" | "monthly";

export interface Recurrence {
  frequency: Frequency;
  /** every N units of the chosen frequency (1 = every week/month) */
  interval: number;
  /** 0=Sun … 6=Sat — used by weekly / biweekly */
  weekday?: number;
  /** 1–28 — used by monthly */
  dayOfMonth?: number;
  /** anchor date (YYYY-MM-DD) the schedule is generated from */
  startDate: string;
}

/* ----------------------------- Lines ------------------------------ */

export interface LineItem {
  id: ID;
  description: string;
  quantity: number;
  unitPrice: number;
}

/* ----------------------------- Quotes ----------------------------- */

export type QuoteType = "one_off" | "recurring";
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Quote {
  id: ID;
  number: string;
  clientName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  type: QuoteType;
  /** present when type === "recurring" */
  recurrence?: Recurrence;
  /** present when type === "one_off" (YYYY-MM-DD) */
  oneOffDate?: string;
  lines: LineItem[];
  /** percent, e.g. 18 = 18% */
  taxRate: number;
  /** absolute amount subtracted before tax */
  discount: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
  validUntil?: string;
  /** set when accepted */
  clientId?: ID;
  generatedServiceIds?: ID[];
}

/* ----------------------------- Clients ---------------------------- */

export interface ServiceTemplate {
  title: string;
  lines: LineItem[];
  durationMin: number;
  preferredTeamId?: ID;
}

export interface Client {
  id: ID;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  recurrence: Recurrence;
  serviceTemplate: ServiceTemplate;
  taxRate: number;
  active: boolean;
  sourceQuoteId?: ID;
  createdAt: string;
}

/* ---------------------------- Services ---------------------------- */

export type ServiceStatus =
  | "unassigned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ServiceType = "one_off" | "recurring";

export type AccountingStatus = "not_applicable" | "pending" | "digitized";

export interface Service {
  id: ID;
  title: string;
  clientId?: ID;
  quoteId?: ID;
  clientName: string;
  address?: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24h) */
  startTime: string;
  durationMin: number;
  teamId?: ID;
  status: ServiceStatus;
  type: ServiceType;
  lines: LineItem[];
  taxRate: number;
  notes?: string;
  accountingStatus: AccountingStatus;
  completedAt?: string;
  digitizedAt?: string;
  createdAt: string;
}
