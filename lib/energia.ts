/**
 * Generación eléctrica del sistema interconectado — Organismo Coordinador del
 * Sistema Eléctrico Nacional Interconectado (OC).
 *
 * Mecánica verificada en docs/AUDITORIA.md §G.8 (2026-09-24): la portada del OC
 * pinta sus gráficos con un servicio JSON público, sin clave, que acepta una
 * fecha (`MM/DD/YYYY`) y responde también días pasados:
 *
 *  - `GET https://apps.oc.org.do/wsOCWebsiteChart/Service.asmx/GetGeneracionReprogramadaJSon?Fecha=…`
 *    → 24 filas horarias {PERIODO, PROGRAMADO, GENERACION, DESVIACION} en MW
 *    medios (la suma del día es MWh).
 *  - `…/GetCentralMarginalPonderadaJSon?Fecha=…` → por período, la central que
 *    fijó el costo marginal. Cuando la marginal es «DESABASTECIMIENTO», el OC
 *    está registrando que en esa hora la oferta no cubrió la demanda. Este
 *    servicio **a veces devuelve menos de 24 períodos** y en otros pone «P-7»
 *    en vez de una planta: se cuentan solo las horas que declara, y se dice
 *    sobre cuántas.
 *
 * Se lee **el día de ayer** (hora de Santo Domingo), que ya está cerrado:
 * caché de una hora. El `robots` de `www.oc.org.do` veta `/Portals/`; este
 * host (`apps.`) no tiene esa regla. Si el día viene incompleto (menos de 24
 * horas de generación), `null`: no se pinta un día a medias como si fuera uno.
 */

const BASE = "https://apps.oc.org.do/wsOCWebsiteChart/Service.asmx";
const USER_AGENT = "Socratico-Inteligencia/1.0 (generacion electrica del OC; herramienta independiente)";

export interface DiaElectrico {
  /** ISO del día leído. */
  fecha: string;
  /** MWh generados y programados en el día. */
  generado: number;
  programado: number;
  /** La hora de mayor generación (1–24) y su potencia media (MW). */
  pico: { periodo: number; mw: number };
  /** Horas en que el OC registró «desabastecimiento» como marginal, sobre las declaradas. */
  desabastecimiento: { horas: number; declaradas: number } | null;
  fuente: string;
}

async function pedir<T>(ruta: string): Promise<T | null> {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(`${BASE}/${ruta}`, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`respondió ${res.status}`);
      if (!/application\/json/i.test(res.headers.get("content-type") ?? "")) return null;
      return (await res.json()) as T;
    } catch (err) {
      if (intento === 2) {
        console.error(`[energia] ${ruta}: ${String(err)}`);
        return null;
      }
    }
  }
  return null;
}

/** Ayer en Santo Domingo, como ISO y como `MM/DD/YYYY` para el servicio. */
function ayer(): { iso: string; oc: string } {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santo_Domingo" });
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  const iso = d.toISOString().slice(0, 10);
  const [a, m, dd] = iso.split("-");
  return { iso, oc: `${m}/${dd}/${a}` };
}

export async function getDiaElectrico(): Promise<DiaElectrico | null> {
  const { iso, oc } = ayer();
  const fecha = encodeURIComponent(oc);
  const [gen, marg] = await Promise.all([
    pedir<{ GetGeneracionReprogramada?: { PERIODO: number; PROGRAMADO: number; GENERACION: number }[] }>(
      `GetGeneracionReprogramadaJSon?Fecha=${fecha}`,
    ),
    pedir<{ GetCentralMarginalPonderada?: { PERIODO: number; CENTRAL: string }[] }>(
      `GetCentralMarginalPonderadaJSon?Fecha=${fecha}`,
    ),
  ]);
  const filas = (gen?.GetGeneracionReprogramada ?? []).filter(
    (f) => Number.isFinite(f.GENERACION) && Number.isFinite(f.PROGRAMADO) && f.PERIODO >= 1 && f.PERIODO <= 24,
  );
  if (new Set(filas.map((f) => f.PERIODO)).size !== 24) return null;
  const pico = filas.reduce((a, b) => (b.GENERACION > a.GENERACION ? b : a));
  const marginales = marg?.GetCentralMarginalPonderada ?? [];
  const periodos = new Map<number, string>();
  for (const m of marginales) if (m.PERIODO >= 1 && m.PERIODO <= 24) periodos.set(m.PERIODO, m.CENTRAL ?? "");
  const horas = [...periodos.values()].filter((c) => /desabastecimiento/i.test(c)).length;
  return {
    fecha: iso,
    generado: filas.reduce((s, f) => s + f.GENERACION, 0),
    programado: filas.reduce((s, f) => s + f.PROGRAMADO, 0),
    pico: { periodo: pico.PERIODO, mw: pico.GENERACION },
    desabastecimiento: periodos.size > 0 ? { horas, declaradas: periodos.size } : null,
    fuente: "https://www.oc.org.do/",
  };
}
