/**
 * Aviso — la anotación al margen del expediente.
 *
 * Existe para la regla §6 de la ergonomía: «no hay resultados» y «la fuente no
 * contestó» son dos pantallas distintas. La segunda dice **qué pasó, qué sigue
 * en pie y cuál es la única acción útil**, y para eso necesita un sitio fijo
 * donde decirlo; si cada página se lo inventa, la mitad no lo dice.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        /** Contexto: explica sin alarmar. */
        neutro: "border-hairline bg-surface text-ink",
        /** La firma: hay algo que se puede hacer. */
        firma: "border-brand-200 bg-brand-50 text-brand-800",
        /** Ocre: corre un plazo, hay un límite de cobertura. */
        aviso: "border-alerta-100 bg-alerta-50 text-alerta-700",
        /** El sello: la fuente no contestó, la operación no se pudo hacer. */
        sello: "border-sello-200 bg-sello-50 text-sello-800",
        /** Verde de archivo: se cumplió. */
        valido: "border-valido-500/25 bg-valido-50 text-valido-700",
      },
    },
    defaultVariants: {
      variant: "neutro",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("mt-1 text-[13px] leading-relaxed opacity-90", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
