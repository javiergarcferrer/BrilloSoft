export function formatMonto(monto: number, divisa: string): string {
  if (!monto && monto !== 0) return "—";
  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: divisa || "DOP",
      maximumFractionDigits: 0,
    }).format(monto);
  } catch {
    return `${divisa} ${monto.toLocaleString("es-DO")}`;
  }
}

export function formatFecha(iso: string | undefined, conHora = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    ...(conHora ? { timeStyle: "short" } : {}),
    timeZone: "America/Santo_Domingo",
  }).format(d);
}

/** Días (con decimales truncados hacia abajo) hasta una fecha; negativo si ya pasó. */
export function diasHasta(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}
