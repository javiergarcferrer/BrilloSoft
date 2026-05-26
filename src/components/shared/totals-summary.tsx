import type { LineItem } from "@/lib/types";
import { computeTotals, formatCurrency } from "@/lib/utils";

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-slate-400" : "text-slate-500"}>
        {label}
      </span>
      <span
        className={
          muted
            ? "tabular-nums text-slate-500"
            : "font-medium tabular-nums text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function TotalsSummary({
  lines,
  taxRate,
  discount = 0,
}: {
  lines: LineItem[];
  taxRate: number;
  discount?: number;
}) {
  const t = computeTotals(lines, taxRate, discount);
  return (
    <div className="space-y-1.5 text-sm">
      <Row label="Subtotal" value={formatCurrency(t.subtotal)} />
      {t.discount > 0 && (
        <Row label="Descuento" value={`– ${formatCurrency(t.discount)}`} muted />
      )}
      <Row label={`ITBIS (${taxRate || 0}%)`} value={formatCurrency(t.tax)} muted />
      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
        <span className="font-semibold text-slate-900">Total</span>
        <span className="font-bold tabular-nums text-slate-900">
          {formatCurrency(t.total)}
        </span>
      </div>
    </div>
  );
}
