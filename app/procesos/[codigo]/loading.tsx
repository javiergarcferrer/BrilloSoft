import { Cargando, Esqueleto } from "@/components/esqueleto";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * La silueta de la ficha de un proceso: el enlace de vuelta, la cabecera con
 * el monto y el plazo, «cómo participar», y los dos paneles de cronograma e
 * información. Las alturas son las del contenido real para que nada salte al
 * llegar la respuesta de la DGCP.
 */
export default function Loading() {
  return (
    <Cargando className="space-y-5">
      <Skeleton className="h-4 w-40" />
      <Esqueleto className="h-56" />
      <Esqueleto className="h-64" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Esqueleto className="h-72" />
        <Esqueleto className="h-72" />
      </div>
    </Cargando>
  );
}
