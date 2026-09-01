/**
 * Vocabulario del papel — las primitivas de la identidad.
 *
 * Antes cada página se dibujaba su propia tarjeta a mano
 * (`rounded-2xl border border-hairline bg-surface shadow-card`), y por eso la
 * identidad se diluía: cambiar el sistema exigía tocar cuarenta sitios y
 * acertar en los cuarenta. Aquí vive el sistema una sola vez.
 *
 * La regla de fondo, de `IDENTIDAD.md`: **el papel no flota**. Las superficies
 * se separan con filete, no con sombra; las esquinas son contenidas; los datos
 * que se verifican van en mono.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------- superficie */

/**
 * Una hoja sobre el papel: la superficie base de toda tarjeta o panel.
 * `acento` pinta el filete superior grueso con el matiz de la vertical o el
 * significado del contenido — es el equivalente de la pestaña de un archivador.
 */
export function Hoja({
  children,
  className,
  acento,
  as: Etiqueta = "section",
}: {
  children: ReactNode;
  className?: string;
  acento?: string;
  as?: "section" | "div" | "article" | "li";
}) {
  return (
    <Etiqueta
      className={cn(
        "overflow-hidden rounded-lg border border-hairline bg-surface",
        acento && `border-t-[3px] ${acento}`,
        className,
      )}
    >
      {children}
    </Etiqueta>
  );
}

/**
 * Cabecera de una hoja: rótulo a la izquierda, dato o enlace a la derecha,
 * separada del cuerpo por su filete. El título va en sans —a 14px la serif se
 * lee floja— y el epígrafe en versalitas monoespaciadas.
 */
export function CabeceraHoja({
  titulo,
  rotulo,
  derecha,
  className,
}: {
  titulo?: ReactNode;
  rotulo?: ReactNode;
  derecha?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-hairline px-5 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        {rotulo && <p className="rotulo text-ink-soft">{rotulo}</p>}
        {titulo && (
          <h2 className="font-sans text-sm font-semibold text-ink">{titulo}</h2>
        )}
      </div>
      {derecha && <div className="shrink-0 text-xs text-ink-soft">{derecha}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ rótulo */

/**
 * Epígrafe de sección, como el encabezado de un formulario. Su punto es el
 * sello: la regla única de la identidad, aplicada aquí una vez para todos.
 */
export function Rotulo({
  children,
  className,
  conPunto = true,
  tono = "text-ink-soft",
}: {
  children: ReactNode;
  className?: string;
  conPunto?: boolean;
  tono?: string;
}) {
  return (
    <p className={cn("rotulo flex items-start gap-2", tono, className)}>
      {conPunto && (
        <span
          aria-hidden
          className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-sello-600"
        />
      )}
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------- datos */

/**
 * Una cifra del registro: monto, censo, plazo. Siempre en mono y tabular —se
 * copia, se compara y se verifica—, con su etiqueta en sans y, si hace falta,
 * la fuente debajo. Nunca se muestra un número sin decir de qué es.
 */
export function Cifra({
  etiqueta,
  valor,
  nota,
  tono = "text-ink",
  className,
}: {
  etiqueta: ReactNode;
  valor: ReactNode;
  nota?: ReactNode;
  tono?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs leading-tight text-ink-soft">{etiqueta}</span>
      <span className={cn("font-mono text-xl font-semibold tabular-nums", tono)}>
        {valor}
      </span>
      {nota && <span className="text-[11px] leading-snug text-ink-soft">{nota}</span>}
    </div>
  );
}

/**
 * Tira de cifras separadas por filetes verticales, como las casillas de un
 * formulario. Es la forma canónica de presentar indicadores: sin tarjetas,
 * sin sombras, sin adornos.
 */
export function TiraDeCifras({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid divide-y divide-hairline border-y border-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 [&>*]:px-5 [&>*]:py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ marcas */

const TONOS_MARCA = {
  sello: "bg-sello-50 text-sello-700",
  firma: "bg-brand-50 text-brand-700",
  alerta: "bg-alerta-50 text-alerta-700",
  valido: "bg-valido-50 text-valido-700",
  neutro: "bg-canvas text-ink-soft",
} as const;

export type TonoMarca = keyof typeof TONOS_MARCA;

/**
 * Marca de estado: el sello de goma sobre el expediente. Rectangular y en
 * versalitas —nunca una píldora—, porque un sello no tiene esquinas redondas.
 */
export function Marca({
  children,
  tono = "neutro",
  className,
}: {
  children: ReactNode;
  tono?: TonoMarca;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rotulo inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[10px]",
        TONOS_MARCA[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ acción */

/**
 * La acción principal: tinta plana, esquina contenida. Un botón no es una
 * píldora de app; es el sello que se estampa al final del formulario.
 */
export function Accion({
  children,
  className,
  tono = "principal",
}: {
  children: ReactNode;
  className?: string;
  tono?: "principal" | "secundaria";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
        tono === "principal"
          ? "bg-brand-500 text-canvas hover:bg-brand-600"
          : "border border-hairline bg-surface text-ink hover:bg-canvas",
        className,
      )}
    >
      {children}
    </span>
  );
}
