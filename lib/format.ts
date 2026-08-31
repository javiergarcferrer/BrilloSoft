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

/**
 * Un valor **sin offset** (`2026-08-28`, `2026-08-28T00:00:00`) es una fecha
 * calendario declarada por la fuente (hora dominicana implícita): se muestra
 * tal cual, sin conversión de zona — convertirla corría el día hacia atrás y
 * dependía de la zona del servidor. Solo los valores con `Z`/offset real son
 * instantes y se convierten a `America/Santo_Domingo`.
 */
export function formatFecha(iso: string | undefined, conHora = false): string {
  if (!iso) return "—";
  const naive = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/.test(iso);
  const d = new Date(naive && iso.includes("T") ? `${iso}Z` : iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    ...(conHora ? { timeStyle: "short" } : {}),
    timeZone: naive ? "UTC" : "America/Santo_Domingo",
  }).format(d);
}

/** Días (con decimales truncados hacia abajo) hasta una fecha; negativo si ya pasó. */
export function diasHasta(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}
