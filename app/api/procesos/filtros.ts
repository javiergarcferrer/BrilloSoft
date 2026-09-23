import { ORDENES, type FiltrosProcesos, type OrdenProceso } from "@/lib/dgcp";
import { ETAPAS, etapaDe } from "@/lib/estados";

/* Enumeraciones cerradas: lo que no esté en la lista no llega a la capa. */
const ETAPAS_VALIDAS = new Set(ETAPAS.map((e) => e.clave as string));
const ORDENES_VALIDOS = new Set<string>(ORDENES);

/** `YYYY-MM-DD` o nada: una fecha con basura no se reenvía a la DGCP. */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const fecha = (v: string | null) => (v && ISO.test(v) ? v : undefined);

/**
 * La etapa pedida. `estado` ya no se reenvía crudo al origen: era el único
 * parámetro de enumeración sin allowlist —contra `.claude/rules/fuentes.md`
 * §API routes— y además ganaba sobre `etapa`, así que
 * `?estado=cualquiercosa&etapa=cerrados` mandaba basura a la DGCP y devolvía
 * un conjunto que contradecía la etapa pedida. Los enlaces antiguos que lo
 * llevan se traducen, como en el feed y en el buscador.
 */
function etapaPedida(sp: URLSearchParams): string | undefined {
  const clave = sp.get("etapa");
  if (clave) return ETAPAS_VALIDAS.has(clave) ? clave : undefined;
  const estado = sp.get("estado");
  return estado ? etapaDe(estado).clave : undefined;
}

/**
 * Los filtros de procesos de un querystring, validados. Lo comparten el
 * listado (`/api/procesos`) y la descarga (`/api/procesos/csv`): la misma
 * búsqueda tiene que dar el mismo conjunto en los dos.
 */
export function filtrosDeQuery(sp: URLSearchParams): FiltrosProcesos {
  const orden = sp.get("orden");
  const uc = sp.get("unidad_compra");
  // Booleanos de la DGCP: solo «true»/«false»; cualquier otra cosa no viaja.
  const si = (v: string | null) => (v === "true" || v === "false" ? v : undefined);
  return {
    q: sp.get("q")?.slice(0, 200) || undefined,
    proceso: sp.get("proceso")?.slice(0, 80) || undefined,
    etapa: etapaPedida(sp),
    orden: orden && ORDENES_VALIDOS.has(orden) ? (orden as OrdenProceso) : undefined,
    modalidad: sp.get("modalidad")?.slice(0, 80) || undefined,
    unidad_compra: uc && /^\d{1,6}$/.test(uc) ? Number(uc) : undefined,
    startdate: fecha(sp.get("startdate")),
    enddate: fecha(sp.get("enddate")),
    mipyme: si(sp.get("mipyme")),
    mipyme_mujer: si(sp.get("mipyme_mujer")),
  };
}
