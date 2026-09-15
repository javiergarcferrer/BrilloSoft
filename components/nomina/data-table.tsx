"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { IconChevronDown, IconChevronUpDown } from "@/components/icons";
import {
  COL,
  formatDOP,
  formatInt,
  type InstitucionNomina,
  type Row,
} from "@/lib/nomina";

export type SortKey = "institucion" | "area" | "cargo" | "sueldo";
export type SortDir = "asc" | "desc";

/**
 * Alto de fila. En teléfono la fila lleva dos líneas (cargo + área·institución)
 * porque las cinco columnas no caben en 326px de pista; la virtualización mide
 * en píxeles, así que el alto tiene que ser el mismo que pinta el CSS.
 */
const ROW_H = 52;
const OVERSCAN = 12;

/**
 * Alto de la pista que se desplaza.
 *
 * En escritorio son 600 px, la mitad larga de la ventana. En un teléfono de
 * 844 px, con 64 de cabecera y 72 de barra inferior, 600 px de pista dejaban
 * 108 px de página alrededor: el dedo casi nunca encontraba el margen y la
 * página parecía atascada dentro de la tabla. A 400 px queda pista de sobra
 * —ocho filas— y sigue habiendo página por arriba y por abajo para salir de
 * ella. No se cambia la mecánica (la pista sigue siendo el contenedor que
 * hace el recorte), solo su medida, y por eso la virtualización lee el alto
 * real del elemento en vez de fiarse de una constante.
 */
const VIEWPORT_H_FALLBACK = 600;

const GRID =
  "grid grid-cols-[minmax(0,1fr)_7.5rem] gap-x-3 sm:grid-cols-[3.5rem_6rem_minmax(0,2.2fr)_minmax(0,2.6fr)_7.5rem]";

export function DataTable({
  rows,
  instituciones,
  areas,
  cargos,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: Row[];
  instituciones: InstitucionNomina[];
  areas: string[];
  cargos: string[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(VIEWPORT_H_FALLBACK);
  const scrollRef = useRef<HTMLDivElement>(null);

  // El alto de la pista lo decide el CSS (400 px en teléfono, 600 desde `sm`);
  // la ventana virtual lo lee del elemento para no tener que repetirlo aquí ni
  // desincronizarse al girar el teléfono.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const medir = () => setViewportH(el.clientHeight || VIEWPORT_H_FALLBACK);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows.length === 0]);

  const total = rows.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(total, Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN);
  const visible = rows.slice(start, end);

  /*
    Esta rejilla **no** es la `Table` de `components/ui`: son cien mil plazas
    virtualizadas, la fila se mide en píxeles para poder saltarse las que no se
    ven, y en teléfono se pliega a dos líneas. Una `<table>` con esa mecánica
    pintaría igual y costaría el desplazamiento fluido, que es justo lo que
    esta vista vende. La primitiva se usa donde manda un cuadro de datos
    normal; aquí manda el rendimiento, y queda dicho para que nadie lo
    «unifique» sin saberlo.
  */
  return (
    <Card>
      {/*
        La cabecera es la única forma de reordenar cien mil filas y sus botones
        medían 17 px de alto. En teléfono el relleno de la barra pasa al propio
        botón (`min-h-11`), que es lo que hace el objetivo táctil sin mover el
        texto de sitio; desde `sm` vuelve el relleno de la barra.
      */}
      <div
        className={cn(
          GRID,
          "border-b border-hairline bg-canvas px-4 rotulo text-ink-soft sm:py-2.5",
        )}
      >
        <span className="hidden font-mono text-right tabular-nums sm:inline">#</span>
        <span className="hidden sm:contents">
          <HeaderCell label="Inst." col="institucion" {...{ sortKey, sortDir, onSort }} />
          <HeaderCell label="Área" col="area" {...{ sortKey, sortDir, onSort }} />
        </span>
        <HeaderCell label="Cargo" col="cargo" {...{ sortKey, sortDir, onSort }} />
        <HeaderCell label="Sueldo" col="sueldo" align="right" {...{ sortKey, sortDir, onSort }} />
      </div>

      {total === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-ink-soft">
          No hay plazas que coincidan con los filtros.
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          className="h-[400px] overflow-auto sm:h-[600px]"
        >
          <div style={{ height: total * ROW_H, position: "relative" }}>
            <div style={{ transform: `translateY(${start * ROW_H}px)` }}>
              {visible.map((r, i) => {
                const idx = start + i;
                const inst = instituciones[r[COL.INST]];
                return (
                  <div
                    key={idx}
                    className={cn(
                      GRID,
                      "items-center px-4 text-sm",
                      idx % 2 ? "bg-surface" : "bg-canvas/50",
                      "hover:bg-brand-50",
                    )}
                    style={{ height: ROW_H }}
                  >
                    <span className="hidden font-mono text-right tabular-nums text-xs text-ink-soft sm:inline">
                      {formatInt(idx + 1)}
                    </span>
                    <span
                      className="hidden truncate font-mono font-medium text-ink sm:inline"
                      title={inst.nombre}
                    >
                      {inst.codigo}
                    </span>
                    <span
                      className="hidden truncate text-ink sm:inline"
                      title={areas[r[COL.AREA]]}
                    >
                      {areas[r[COL.AREA]]}
                    </span>
                    {/* Teléfono: cargo arriba, área e institución debajo. */}
                    <span className="min-w-0">
                      <span className="block truncate text-ink" title={cargos[r[COL.CARGO]]}>
                        {cargos[r[COL.CARGO]]}
                      </span>
                      {/* Área e institución son el contexto de la plaza, no un pie: 12 px. */}
                      <span className="block truncate text-xs text-ink-soft sm:hidden">
                        {areas[r[COL.AREA]]} · {inst.codigo}
                      </span>
                    </span>
                    <span className="text-right font-mono tabular-nums text-ink">
                      {formatDOP(r[COL.SUELDO])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function HeaderCell({
  label,
  col,
  align = "left",
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  align?: "left" | "right";
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const activeSort = sortKey === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        "flex min-h-11 items-center gap-1 transition-colors hover:text-brand-700 sm:min-h-0",
        align === "right" && "justify-end",
        activeSort && "text-brand-700",
      )}
    >
      {label}
      <SortGlyph active={activeSort} dir={sortDir} />
    </button>
  );
}

/** El glifo del orden, del juego de iconos de la casa y no de un svg suelto. */
function SortGlyph({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <IconChevronUpDown className="h-3.5 w-3.5 opacity-40" />;
  return (
    <IconChevronDown
      className={cn("h-3.5 w-3.5", dir === "asc" && "rotate-180")}
    />
  );
}
