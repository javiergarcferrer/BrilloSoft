import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Reasonably-unique id for client-side entities. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(Number.isFinite(value) ? value : 0);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatCurrency(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : plural ?? `${singular}s`;
}

/* ----------------------------- money math ----------------------------- */

export interface MoneyLine {
  quantity: number;
  unitPrice: number;
}

export function lineTotal(line: MoneyLine): number {
  return (line.quantity || 0) * (line.unitPrice || 0);
}

export function subtotalOf(lines: MoneyLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

export interface Totals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export function computeTotals(
  lines: MoneyLine[],
  taxRate = 0,
  discount = 0,
): Totals {
  const subtotal = subtotalOf(lines);
  const safeDiscount = clamp(discount || 0, 0, subtotal);
  const taxable = subtotal - safeDiscount;
  const tax = taxable * ((taxRate || 0) / 100);
  return {
    subtotal,
    discount: safeDiscount,
    taxable,
    tax,
    total: taxable + tax,
  };
}
