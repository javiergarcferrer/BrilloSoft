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

/** El día calendario dominicano de un instante, como `2026-09-04`. */
const DIA_RD = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santo_Domingo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Antigüedad en lenguaje llano: «hace 4 meses», «ayer», «hoy».
 *
 * Una fecha absoluta obliga a restar mentalmente. En una lista de veinte
 * iniciativas, ese cálculo se repite veinte veces y nadie lo hace: se deja de
 * comparar. El dato que responde «¿esto está vivo o parado?» no puede costar
 * una resta.
 *
 * Se cuenta en **días de calendario dominicano**, la misma regla que
 * `formatFecha`: «ayer» significa la fecha de ayer en Santo Domingo, no «entre
 * 24 y 48 horas atrás». Antes se restaban milisegundos contra un ancla
 * arbitraria al mediodía UTC, y eso rompía dos veces al día: entre las 00:00 y
 * las 12:00 UTC —cuando en el país todavía es la tarde o la noche anterior—
 * una pieza depositada *hoy* salía como fecha futura y la interfaz caía a la
 * fecha absoluta; y la frontera entre «hoy» y «ayer» se movía a las 8 de la
 * mañana local en vez de a medianoche.
 */
export function hace(valor: string | null | undefined): string | null {
  if (!valor) return null;

  /*
    Un valor sin hora es una fecha de calendario declarada por la fuente y se
    compara tal cual; uno con instante real se lleva primero al día que era en
    el país. Misma distinción que hace `formatFecha`.
  */
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  let dia: string;
  if (soloFecha) {
    dia = valor;
  } else {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return null;
    dia = DIA_RD.format(d);
  }

  const hoy = DIA_RD.format(Date.now());
  const aMedianocheUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  const desde = aMedianocheUTC(dia);
  const hasta = aMedianocheUTC(hoy);
  if (Number.isNaN(desde) || Number.isNaN(hasta)) return null;

  const dias = Math.round((hasta - desde) / 86_400_000);
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
/**
 * Pesos escritos con su unidad, para las cifras grandes del Estado.
 *
 * Misma regla que `formatMagnitud` y por el mismo motivo: abreviar mil
 * millones como «MM» —que en uso dominicano se lee *millones*— se equivoca por
 * tres órdenes de magnitud justo en las cifras que más pesan. El presupuesto
 * del Estado se cuenta en billones de pesos: la unidad viaja con el número.
 */
export function formatPesos(pesos: number): string {
  const abs = Math.abs(pesos);
  if (abs >= 1e12) return `RD$ ${(pesos / 1e12).toFixed(2)} billones`;
  if (abs >= 1e9) return `RD$ ${(pesos / 1e9).toFixed(1)} mil millones`;
  if (abs >= 1e6) return `RD$ ${(pesos / 1e6).toFixed(1)} millones`;
  return formatMonto(pesos, "DOP");
}

export function formatMagnitud(millonesUSD: number): string {
  if (millonesUSD >= 1000) {
    const miles = millonesUSD / 1000;
    return `US$ ${miles.toFixed(1)} mil millones`;
  }
  return `US$ ${Math.round(millonesUSD).toLocaleString("es-DO")} millones`;
}
