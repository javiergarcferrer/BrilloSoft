import {
  createParser,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import type { OrdenProceso } from "@/lib/dgcp";

/**
 * Los filtros de `/licitaciones` tal como viajan en la URL.
 *
 * Es el contrato de los enlaces compartidos y de las búsquedas guardadas
 * (`lib/busquedas.ts` guarda el querystring crudo), así que los nombres y los
 * valores son los de siempre: `q`, `etapa`, `modalidad`, `desde`, `hasta`,
 * `mipyme=1`, `orden`, `uc`, `page`, y `estado`, que ya no se escribe pero se
 * lee para traducir los enlaces viejos. Lo leen dos componentes —el buscador
 * (`app/buscador.tsx`) y su campo de texto (`components/campo-licitaciones.tsx`)—
 * y por eso el mapa vive aquí: si cada uno declarara el suyo, un mismo
 * parámetro podría leerse de dos maneras.
 *
 * Un valor por defecto **no se escribe**: la URL de la búsqueda con que abre
 * la página es `/licitaciones` a secas, y `nuqs` borra el parámetro cuando el
 * valor vuelve a su defecto (`clearOnDefault`). Los que no tienen defecto
 * aquí —`etapa`, `desde`— lo tienen en el buscador, porque su vacío significa
 * algo: `etapa=` es «todas» y `desde=` es «todo el histórico».
 */

/*
  La misma enumeración que la ruta usa de allowlist (`ORDENES` en lib/dgcp.ts).
  Se repite como literal porque importar el valor metería el adaptador entero
  en el bundle del navegador. El `satisfies` avisa si la lista tiene un orden
  que el tipo no conoce; `_TodosLosOrdenes` avisa del lado contrario —un
  orden nuevo en `OrdenProceso` que aquí falta y que un enlace compartido
  perdería en silencio—.
*/
const ORDENES_URL = ["recientes", "cierre", "monto_desc", "monto_asc"] as const satisfies readonly OrdenProceso[];
type _TodosLosOrdenes = Exclude<OrdenProceso, (typeof ORDENES_URL)[number]> extends never ? true : never;
const _todosLosOrdenes: _TodosLosOrdenes = true;
void _todosLosOrdenes;

/** `mipyme=1` y nada más: cualquier otro valor, o su ausencia, es «no». */
const parseAsUno = createParser({
  parse: (v) => v === "1",
  serialize: (b: boolean) => (b ? "1" : "0"),
});

export const FILTROS_LICITACIONES = {
  q: parseAsString.withDefault(""),
  etapa: parseAsString,
  estado: parseAsString,
  modalidad: parseAsString.withDefault(""),
  desde: parseAsString,
  hasta: parseAsString.withDefault(""),
  mipyme: parseAsUno.withDefault(false),
  orden: parseAsStringLiteral(ORDENES_URL).withDefault("recientes"),
  uc: parseAsInteger,
  page: parseAsInteger.withDefault(1),
};
