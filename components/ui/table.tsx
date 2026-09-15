/**
 * Tabla — el cuadro del expediente.
 *
 * Dos diferencias con la de shadcn, y las dos son de esta casa:
 *
 *  · El contenedor tiene `overflow-x-auto`, porque el ciudadano consulta en el
 *    teléfono: una tabla ancha se desplaza dentro de su caja en vez de empujar
 *    la página entera.
 *  · Las cabeceras van en versalitas monoespaciadas (`rotulo`) y las celdas
 *    numéricas en mono tabular (`TableCell numerica`), que es la regla de
 *    reparto tipográfico: lo que se copia y se verifica va en mono.
 */

import * as React from "react";

import { cn } from "@/lib/cn";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      /*
        `overscroll-x-contain`: cuando el dedo llega al final del cuadro, el
        gesto se queda aquí y no se convierte en el «volver atrás» del
        navegador, que es lo que pasaba al barrer una tabla ancha en iOS.
      */
      className="w-full overflow-x-auto overscroll-x-contain"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-hairline", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("divide-y divide-hairline", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-hairline bg-canvas font-medium text-ink",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors data-[state=selected]:bg-brand-50",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "rotulo whitespace-nowrap px-3 py-2.5 text-left align-middle text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  numerica = false,
  ...props
}: React.ComponentProps<"td"> & {
  /** Monto, código, fecha o porcentaje: mono tabular y alineado a la derecha. */
  numerica?: boolean;
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 align-middle",
        numerica && "text-right font-mono tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-xs text-ink-soft", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
