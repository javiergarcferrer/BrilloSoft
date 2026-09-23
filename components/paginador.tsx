import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Anterior · dónde estoy · siguiente — uno, no dos.
 *
 * Estaba escrito dos veces y se había separado: Congreso con mandos de 44 px,
 * flechas y la posición en mono; el buscador con 40 px, chevrones y la posición
 * en sans; uno escondía el mando que no aplica y el otro lo apagaba, así que
 * «Siguiente» saltaba de sitio entre la primera página y la segunda. Ahora:
 *
 *  · **Los mandos a la talla por defecto** —44 px en el teléfono—: paginar es
 *    la acción más repetida de un listado y se hace con el pulgar.
 *  · **En los bordes**, con `justify-between`, que es donde el pulgar llega sin
 *    recolocar la mano; la posición en medio, en la letra del registro.
 *  · **El mando que no aplica se apaga, no desaparece**: la fila no se mueve
 *    bajo el dedo, y un botón apagado en la primera página ya explica por qué.
 *
 * Dos mecánicas, una pieza: con `href` cada mando es un enlace —la página vive
 * en la URL y se comparte—; con `onPage`, un botón que cambia el estado de un
 * listado de cliente.
 */
export function Paginador({
  pagina,
  paginas,
  href,
  onPage,
  pendiente = false,
  etiqueta = "Paginación de los resultados",
  className,
}: {
  pagina: number;
  paginas: number;
  /** La URL de una página. Si se pasa, los mandos son enlaces. */
  href?: (pagina: number) => string;
  /** Si no hay `href`: qué hacer al pedir otra página. */
  onPage?: (pagina: number) => void;
  /** Mientras llega una página, los mandos esperan. */
  pendiente?: boolean;
  etiqueta?: string;
  className?: string;
}) {
  const mando = (destino: number, rel: "prev" | "next") => {
    const contenido =
      rel === "prev" ? (
        <>
          <IconChevronLeft className="h-4 w-4" />
          Anterior
        </>
      ) : (
        <>
          Siguiente
          <IconChevronRight className="h-4 w-4" />
        </>
      );
    const aplica = destino >= 1 && destino <= paginas && !pendiente;

    if (href && aplica) {
      return (
        <Button asChild variant="secondary">
          <Link href={href(destino)} rel={rel}>
            {contenido}
          </Link>
        </Button>
      );
    }
    return (
      <Button
        variant="secondary"
        disabled={!aplica}
        // Sin `onPage` no hay manejador: desde un componente de servidor, un
        // `onClick` en un elemento nativo rompe el render.
        onClick={onPage && aplica ? () => onPage(destino) : undefined}
      >
        {contenido}
      </Button>
    );
  };

  return (
    <nav
      aria-label={etiqueta}
      className={cn("flex items-center justify-between gap-3", className)}
    >
      {mando(pagina - 1, "prev")}
      <span className="font-mono text-xs tabular-nums text-ink-soft">
        Página {pagina.toLocaleString("es-DO")} de {paginas.toLocaleString("es-DO")}
      </span>
      {mando(pagina + 1, "next")}
    </nav>
  );
}
