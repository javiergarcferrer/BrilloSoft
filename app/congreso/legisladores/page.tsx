import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EstadoVacio } from "@/components/estado-vacio";
import { EsqueletoFilas, Esqueleto } from "@/components/esqueleto";
import { FiltroEnlace, NavFiltros } from "@/components/nav-filtros";
import { Paginador } from "@/components/paginador";
import {
  claveProvincia,
  getDirectorioLegisladores,
  hrefLegislador,
  type Legislador,
} from "@/lib/congreso";
import FiltrosLegisladores from "./filtros-legisladores";
import { hrefDirectorio, type FiltrosDirectorio } from "./href";

export const metadata: Metadata = {
  alternates: { canonical: "/congreso/legisladores" },
  title: "Legisladores",
  description:
    "Diputados y senadores del período 2024-2028: por provincia y partido, con lo que propusieron y cómo votaron en la Cámara.",
};

export const revalidate = 3600;

/** Filas por página: el directorio entero son 221 personas. */
const POR_PAGINA = 30;

type Props = {
  searchParams: Promise<{
    q?: string;
    provincia?: string;
    partido?: string;
    camara?: string;
    page?: string;
  }>;
};

/*
  El directorio se lee entero del SIL —34 demarcaciones, unas 41 peticiones,
  cacheadas un día— y se filtra aquí. Por eso la cabecera llega sola y el
  listado cae en su `Suspense` cuando el SIL contesta.
*/
export default async function LegisladoresPage({ searchParams }: Props) {
  const p = await searchParams;
  const filtros: FiltrosDirectorio = {
    q: p.q?.trim() ?? "",
    provincia: p.provincia?.trim() ?? "",
    partido: p.partido?.trim() ?? "",
    camara: p.camara === "diputados" || p.camara === "senado" ? p.camara : "",
  };
  const pagina = Math.max(1, Number(p.page ?? "1") || 1);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          ¿Quién te representa en el Congreso?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Diputados y senadores del período 2024-2028, con lo que propusieron,
          cuánto prosperó y cómo votaron en la Cámara.{" "}
          <a
            href="/congreso/legisladores/csv"
            download
            className="font-medium text-brand-700 hover:underline"
          >
            Descargar el directorio (CSV)
          </a>
        </p>
      </header>

      <Suspense
        key={JSON.stringify(filtros) + pagina}
        fallback={
          <div role="status" aria-busy="true">
            <Esqueleto className="h-11" />
            <p className="mt-4 text-sm text-ink-soft">Consultando el directorio del SIL…</p>
            <EsqueletoFilas n={10} className="mt-3" />
          </div>
        }
      >
        <Directorio filtros={filtros} pagina={pagina} />
      </Suspense>
    </div>
  );
}

/** Sin tildes ni mayúsculas: «Mélido» se encuentra escribiendo «melido». */
function plano(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function contar<T>(items: T[], clave: (t: T) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = clave(it);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

async function Directorio({ filtros, pagina }: { filtros: FiltrosDirectorio; pagina: number }) {
  const directorio = await getDirectorioLegisladores();

  if (!directorio) {
    return (
      <EstadoVacio
        variante="caida"
        titulo="El SIL de la Cámara no respondió"
        accion={
          <Button asChild variant="secondary">
            <Link href="/fuentes">Ver el estado de las fuentes</Link>
          </Button>
        }
      >
        No pudimos leer el directorio de legisladores. No es que no haya: es que
        no pudimos mirar. Las iniciativas del Congreso pueden seguir
        consultándose desde la vista de Diputados.
      </EstadoVacio>
    );
  }

  const todos = directorio.legisladores;
  const diputados = todos.filter((l) => l.camara === "diputados").length;
  const senadores = todos.length - diputados;

  // Los recuentos de cada filtro se calculan sobre lo que dejan los **otros**
  // filtros, para que el número del chip diga lo que se obtiene al pulsarlo.
  const porCamara = todos.filter((l) => !filtros.camara || l.camara === filtros.camara);
  // La provincia llega a veces con el nombre corriente —«Monte Cristi»,
  // «Elías Piña» desde /provincias— y no con la grafía del SIL: se compara
  // por clave y se devuelve al filtro el nombre del SIL, para que el
  // selector la muestre elegida.
  const clave = claveProvincia(filtros.provincia);
  const porProvincia = porCamara.filter(
    (l) => !filtros.provincia || claveProvincia(l.provincia) === clave,
  );
  const provinciaSil =
    (filtros.provincia && todos.find((l) => claveProvincia(l.provincia) === clave)?.provincia) ||
    filtros.provincia;
  const filtrosSil: FiltrosDirectorio = { ...filtros, provincia: provinciaSil };
  const partidos = [...contar(porProvincia, (l) => l.partidoSiglas).entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const provincias = [...contar(porCamara, (l) => l.provincia).entries()]
    .map(([nombre, cuantos]) => ({ nombre, cuantos }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const q = plano(filtros.q);
  const filtrados = porProvincia
    .filter((l) => !filtros.partido || l.partidoSiglas === filtros.partido)
    .filter((l) => !q || plano(l.nombre).includes(q));

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const visibles = filtrados.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);

  return (
    <>
      <FiltrosLegisladores filtros={filtrosSil} provincias={provincias} total={todos.length} />

      <NavFiltros etiqueta="Cámara" className="mt-4">
        <FiltroEnlace href={hrefDirectorio({ ...filtrosSil, camara: "" })} activo={!filtros.camara}>
          {`Ambas cámaras (${todos.length})`}
        </FiltroEnlace>
        <FiltroEnlace
          href={hrefDirectorio({ ...filtrosSil, camara: "diputados" })}
          activo={filtros.camara === "diputados"}
        >
          {`Diputados (${diputados})`}
        </FiltroEnlace>
        <FiltroEnlace
          href={hrefDirectorio({ ...filtrosSil, camara: "senado" })}
          activo={filtros.camara === "senado"}
        >
          {`Senadores (${senadores})`}
        </FiltroEnlace>
      </NavFiltros>

      <NavFiltros etiqueta="Partido" className="mt-2">
        <FiltroEnlace href={hrefDirectorio({ ...filtrosSil, partido: "" })} activo={!filtros.partido}>
          Todos los partidos
        </FiltroEnlace>
        {partidos.map(([siglas, n]) => (
          <FiltroEnlace
            key={siglas}
            href={hrefDirectorio({ ...filtrosSil, partido: siglas })}
            activo={filtros.partido === siglas}
            mono
          >
            {`${siglas} ${n}`}
          </FiltroEnlace>
        ))}
      </NavFiltros>

      {directorio.fallidas.length > 0 && (
        <Alert variant="aviso" className="mt-4">
          <p className="text-sm font-semibold text-alerta-700">Directorio incompleto</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            El SIL no respondió para {directorio.fallidas.join(", ")} (
            {directorio.fallidas.length} de {directorio.demarcaciones} demarcaciones). Los
            recuentos de esta página no las incluyen.
          </p>
        </Alert>
      )}

      <p className="mt-4 text-sm text-ink-soft">
        <span className="font-mono tabular-nums">
          {filtrados.length} {filtrados.length === 1 ? "legislador" : "legisladores"}
        </span>
        {filtros.q && (
          <>
            {" para "}
            <span className="font-medium text-ink">{`“${filtros.q}”`}</span>
          </>
        )}
      </p>

      {visibles.length > 0 ? (
        <Card as="section" className="mt-3">
          <ul>
            {visibles.map((l) => (
              <FilaLegislador key={l.id} legislador={l} />
            ))}
          </ul>
        </Card>
      ) : (
        <EstadoVacio titulo="Nadie con esos filtros" className="mt-3">
          {filtros.q
            ? "La búsqueda compara el nombre completo sin tildes. Prueba con un solo apellido o quita algún filtro."
            : "Ningún legislador del directorio cumple a la vez todos los filtros elegidos."}
        </EstadoVacio>
      )}

      {paginas > 1 && (
        <Paginador
          pagina={actual}
          paginas={paginas}
          href={(n) => {
            const base = hrefDirectorio(filtrosSil);
            return n > 1 ? `${base}${base.includes("?") ? "&" : "?"}page=${n}` : base;
          }}
          etiqueta="Paginación de legisladores"
          className="mt-5"
        />
      )}

      <p className="mt-5 text-xs leading-relaxed text-ink-soft">
        Fuente: directorio del SIL de la Cámara de Diputados, período 2024-2028
        ({diputados} diputados y {senadores} senadores). Los senadores figuran
        porque firman piezas que llegan a la Cámara; su voto se registra en el
        Senado, no aquí.
      </p>
    </>
  );
}

function FilaLegislador({ legislador: l }: { legislador: Legislador }) {
  return (
    <li className="relative border-b border-hairline last:border-0">
      <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <Link
            href={hrefLegislador(l.id)}
            className="text-[15px] font-medium leading-snug text-ink after:absolute after:inset-0 hover:text-brand-700"
          >
            {l.nombre}
          </Link>
          <p className="mt-0.5 text-xs text-ink-soft">
            {[l.funcion, l.provincia, l.circunscripcion].filter(Boolean).join(" · ")}
          </p>
        </div>
        {l.partidoSiglas && (
          <Badge variant="neutro" title={l.partidoNombre ?? undefined} className="mt-0.5">
            {l.partidoSiglas}
          </Badge>
        )}
      </div>
    </li>
  );
}
