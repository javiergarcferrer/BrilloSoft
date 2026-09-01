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

/**
 * Antigüedad en lenguaje llano: «hace 4 meses», «ayer», «hoy».
 *
 * Una fecha absoluta obliga a restar mentalmente. En una lista de veinte
 * iniciativas, ese cálculo se repite veinte veces y nadie lo hace: se deja de
 * comparar. El dato que responde «¿esto está vivo o parado?» no puede costar
 * una resta.
 */
export function hace(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor.length <= 10 ? `${valor}T12:00:00Z` : valor);
  if (Number.isNaN(d.getTime())) return null;

  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (dias < 0) return null;
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;

  const meses = Math.floor(dias / 30.44);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;

  const anios = Math.floor(dias / 365.25);
  const resto = Math.floor((dias - anios * 365.25) / 30.44);
  if (resto === 0) return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
  return `hace ${anios} ${anios === 1 ? "año" : "años"} y ${resto} ${resto === 1 ? "mes" : "meses"}`;
}

/**
 * Magnitud escrita, no abreviada. En uso dominicano «MM» se lee *millones*, de
 * modo que abreviar miles de millones así se equivoca por tres órdenes de
 * magnitud —y la cifra más grande de la plataforma es la más fácil de
 * malinterpretar—. Aquí la unidad viaja con el número, no en una nota al pie.
 */
export function formatMagnitud(millonesUSD: number): string {
  if (millonesUSD >= 1000) {
    const miles = millonesUSD / 1000;
    return `US$ ${miles.toFixed(1)} mil millones`;
  }
  return `US$ ${Math.round(millonesUSD).toLocaleString("es-DO")} millones`;
}
