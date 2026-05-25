import {
  addDays,
  addMonths,
  format,
  getDate,
  getDay,
  getDaysInMonth,
  isBefore,
  parseISO,
  setDate,
  startOfDay,
} from "date-fns";
import type { Frequency, Recurrence } from "./types";

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function frequencyLabel(f: Frequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === f)?.label ?? f;
}

export function recurrenceLabel(r: Recurrence): string {
  if (r.frequency === "monthly") {
    return `Monthly on the ${ordinal(r.dayOfMonth ?? 1)}`;
  }
  const wd = WEEKDAYS_LONG[r.weekday ?? 1];
  if (r.frequency === "biweekly") return `Every 2 weeks on ${wd}`;
  if ((r.interval ?? 1) > 1) return `Every ${r.interval} weeks on ${wd}`;
  return `Weekly on ${wd}`;
}

function clampToMonth(year: number, monthIndex: number, day: number): Date {
  const base = new Date(year, monthIndex, 1);
  return setDate(base, Math.min(day, getDaysInMonth(base)));
}

function seriesStart(r: Recurrence): Date {
  const start = startOfDay(parseISO(r.startDate));
  if (r.frequency === "monthly") {
    const day = r.dayOfMonth ?? getDate(start);
    let candidate = clampToMonth(start.getFullYear(), start.getMonth(), day);
    if (isBefore(candidate, start)) {
      candidate = clampToMonth(
        start.getFullYear(),
        start.getMonth() + Math.max(1, r.interval || 1),
        day,
      );
    }
    return candidate;
  }
  const weekday = r.weekday ?? getDay(start);
  const diff = (weekday - getDay(start) + 7) % 7;
  return addDays(start, diff);
}

function advance(r: Recurrence, cursor: Date): Date {
  if (r.frequency === "weekly") return addDays(cursor, 7 * Math.max(1, r.interval || 1));
  if (r.frequency === "biweekly") return addDays(cursor, 14);
  // monthly — recompute day so long months don't erode the anchor day
  const next = addMonths(cursor, Math.max(1, r.interval || 1));
  return clampToMonth(next.getFullYear(), next.getMonth(), r.dayOfMonth ?? getDate(cursor));
}

/**
 * The next `count` occurrence dates (YYYY-MM-DD) on or after `from`.
 */
export function nextOccurrences(
  r: Recurrence,
  from: Date,
  count: number,
): string[] {
  const out: string[] = [];
  const fromDay = startOfDay(from);
  let cursor = seriesStart(r);
  let guard = 0;
  while (out.length < count && guard < 6000) {
    guard += 1;
    if (!isBefore(cursor, fromDay)) {
      out.push(format(cursor, "yyyy-MM-dd"));
    }
    cursor = advance(r, cursor);
  }
  return out;
}

/** Approximate number of billable occurrences per month (for MRR-style math). */
export function occurrencesPerMonth(r: Recurrence): number {
  switch (r.frequency) {
    case "weekly":
      return 4.33 / Math.max(1, r.interval || 1);
    case "biweekly":
      return 2.17;
    case "monthly":
      return 1 / Math.max(1, r.interval || 1);
  }
}
