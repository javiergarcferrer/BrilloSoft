/**
 * Neuropsychological color system.
 *
 * Color is used as a pre-attentive signal so the coordinator/accountant can
 * read state without reading text:
 *
 *   amber  → action required (unassigned, awaiting digitization)
 *   blue   → planned & calm (scheduled, sent)
 *   cyan   → active right now (in progress)  — paired with a pulse
 *   green  → success / value realized (completed, accepted, digitized)
 *   rose   → closed / negative (rejected)
 *   violet → special, ongoing relationship (recurring)
 *   slate  → inactive / neutral (cancelled, draft, n/a)
 *
 * All class strings are LITERAL so Tailwind's scanner emits them.
 */

import type {
  AccountingStatus,
  QuoteStatus,
  QuoteType,
  ServiceStatus,
  ServiceType,
} from "./types";

export interface StatusMeta {
  label: string;
  /** why this hue — surfaced in tooltips/legends */
  rationale: string;
  hex: string;
  /** small status dot */
  dot: string;
  /** text-only accent */
  text: string;
  /** pill badge (bg + text + ring) */
  badge: string;
  /** soft calendar/list chip (bg + text + border) */
  chip: string;
  /** saturated fill */
  solid: string;
}

export const SERVICE_STATUS_META: Record<ServiceStatus, StatusMeta> = {
  unassigned: {
    label: "Unassigned",
    rationale: "Amber draws the eye — this job still needs a team.",
    hex: "#f59e0b",
    dot: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    chip: "bg-amber-50 text-amber-900 border-amber-300",
    solid: "bg-amber-500 text-white",
  },
  scheduled: {
    label: "Scheduled",
    rationale: "Blue reads as calm and dependable — it's planned.",
    hex: "#3b82f6",
    dot: "bg-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    chip: "bg-blue-50 text-blue-900 border-blue-300",
    solid: "bg-blue-500 text-white",
  },
  in_progress: {
    label: "In progress",
    rationale: "Cyan + pulse signals live activity happening now.",
    hex: "#06b6d4",
    dot: "bg-cyan-500",
    text: "text-cyan-700",
    badge: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-600/20",
    chip: "bg-cyan-50 text-cyan-900 border-cyan-300",
    solid: "bg-cyan-500 text-white",
  },
  completed: {
    label: "Completed",
    rationale: "Green = achievement; value is realized.",
    hex: "#10b981",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    chip: "bg-emerald-50 text-emerald-900 border-emerald-300",
    solid: "bg-emerald-500 text-white",
  },
  cancelled: {
    label: "Cancelled",
    rationale: "Slate recedes — de-emphasised, no action needed.",
    hex: "#94a3b8",
    dot: "bg-slate-400",
    text: "text-slate-500",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
    chip: "bg-slate-100 text-slate-500 border-slate-300",
    solid: "bg-slate-400 text-white",
  },
};

export const QUOTE_STATUS_META: Record<QuoteStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    rationale: "Slate — a work in progress, not yet in play.",
    hex: "#94a3b8",
    dot: "bg-slate-400",
    text: "text-slate-500",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
    chip: "bg-slate-100 text-slate-600 border-slate-300",
    solid: "bg-slate-400 text-white",
  },
  sent: {
    label: "Sent",
    rationale: "Blue — out for review, awaiting the client.",
    hex: "#3b82f6",
    dot: "bg-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    chip: "bg-blue-50 text-blue-900 border-blue-300",
    solid: "bg-blue-500 text-white",
  },
  accepted: {
    label: "Accepted",
    rationale: "Green — a win; revenue is now in motion.",
    hex: "#10b981",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    chip: "bg-emerald-50 text-emerald-900 border-emerald-300",
    solid: "bg-emerald-500 text-white",
  },
  rejected: {
    label: "Rejected",
    rationale: "Rose — closed lost; clearly negative but not alarming.",
    hex: "#f43f5e",
    dot: "bg-rose-500",
    text: "text-rose-700",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    chip: "bg-rose-50 text-rose-900 border-rose-300",
    solid: "bg-rose-500 text-white",
  },
};

export const ACCOUNTING_STATUS_META: Record<AccountingStatus, StatusMeta> = {
  not_applicable: {
    label: "—",
    rationale: "Slate — nothing to reconcile yet.",
    hex: "#94a3b8",
    dot: "bg-slate-300",
    text: "text-slate-400",
    badge: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-400/20",
    chip: "bg-slate-100 text-slate-500 border-slate-200",
    solid: "bg-slate-300 text-white",
  },
  pending: {
    label: "Awaiting entry",
    rationale: "Amber — the accountant must digitize this movement.",
    hex: "#f59e0b",
    dot: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    chip: "bg-amber-50 text-amber-900 border-amber-300",
    solid: "bg-amber-500 text-white",
  },
  digitized: {
    label: "Digitized",
    rationale: "Green — recorded in the accounting system.",
    hex: "#10b981",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    chip: "bg-emerald-50 text-emerald-900 border-emerald-300",
    solid: "bg-emerald-500 text-white",
  },
};

export interface TypeMeta {
  label: string;
  hex: string;
  badge: string;
  dot: string;
}

export const SERVICE_TYPE_META: Record<ServiceType, TypeMeta> = {
  one_off: {
    label: "One-off",
    hex: "#64748b",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  },
  recurring: {
    label: "Recurring",
    hex: "#8b5cf6",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20",
  },
};

export const QUOTE_TYPE_META: Record<QuoteType, TypeMeta> = SERVICE_TYPE_META;

/* ----------------------------- team palette ----------------------------- */

export interface TeamColor {
  name: string;
  hex: string;
  dot: string;
  soft: string;
  stripe: string;
  text: string;
  ring: string;
}

/**
 * Saturated, perceptually-distinct hues for crew identity. Teams appear as a
 * colored stripe + avatar so they never compete with the (pastel) status
 * coding on a calendar chip.
 */
export const TEAM_PALETTE: Record<string, TeamColor> = {
  indigo: {
    name: "Indigo",
    hex: "#6366f1",
    dot: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-700",
    stripe: "bg-indigo-500",
    text: "text-indigo-600",
    ring: "ring-indigo-500/30",
  },
  sky: {
    name: "Sky",
    hex: "#0ea5e9",
    dot: "bg-sky-500",
    soft: "bg-sky-50 text-sky-700",
    stripe: "bg-sky-500",
    text: "text-sky-600",
    ring: "ring-sky-500/30",
  },
  violet: {
    name: "Violet",
    hex: "#8b5cf6",
    dot: "bg-violet-500",
    soft: "bg-violet-50 text-violet-700",
    stripe: "bg-violet-500",
    text: "text-violet-600",
    ring: "ring-violet-500/30",
  },
  fuchsia: {
    name: "Fuchsia",
    hex: "#d946ef",
    dot: "bg-fuchsia-500",
    soft: "bg-fuchsia-50 text-fuchsia-700",
    stripe: "bg-fuchsia-500",
    text: "text-fuchsia-600",
    ring: "ring-fuchsia-500/30",
  },
  orange: {
    name: "Orange",
    hex: "#f97316",
    dot: "bg-orange-500",
    soft: "bg-orange-50 text-orange-700",
    stripe: "bg-orange-500",
    text: "text-orange-600",
    ring: "ring-orange-500/30",
  },
  lime: {
    name: "Lime",
    hex: "#65a30d",
    dot: "bg-lime-600",
    soft: "bg-lime-50 text-lime-700",
    stripe: "bg-lime-600",
    text: "text-lime-700",
    ring: "ring-lime-600/30",
  },
  pink: {
    name: "Pink",
    hex: "#ec4899",
    dot: "bg-pink-500",
    soft: "bg-pink-50 text-pink-700",
    stripe: "bg-pink-500",
    text: "text-pink-600",
    ring: "ring-pink-500/30",
  },
  rose: {
    name: "Rose",
    hex: "#f43f5e",
    dot: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700",
    stripe: "bg-rose-500",
    text: "text-rose-600",
    ring: "ring-rose-500/30",
  },
};

export const TEAM_COLOR_KEYS = Object.keys(TEAM_PALETTE);

const FALLBACK_TEAM: TeamColor = TEAM_PALETTE.indigo;

export function teamColor(key: string | undefined): TeamColor {
  if (!key) return FALLBACK_TEAM;
  return TEAM_PALETTE[key] ?? FALLBACK_TEAM;
}

export const SERVICE_STATUS_ORDER: ServiceStatus[] = [
  "unassigned",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

export const QUOTE_STATUS_ORDER: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
];
