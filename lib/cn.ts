import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases y **resuelve el conflicto en favor de la última**.
 *
 * Antes era un `filter(Boolean).join(" ")`: bastaba mientras nadie compusiera
 * clases. Con las primitivas de `components/ui/*` sí se componen —cada una
 * trae su base y el sitio de uso la ajusta por `className`—, y un simple
 * concatenado dejaba las dos en la hoja de estilo: `bg-surface bg-canvas`
 * ganaba por orden de declaración en el CSS, no por orden de escritura, que es
 * justo lo contrario de lo que lee quien escribe la línea. `twMerge` conoce la
 * gramática de Tailwind y se queda con la última de cada familia.
 */
export function cn(...parts: ClassValue[]): string {
  return twMerge(clsx(parts));
}
