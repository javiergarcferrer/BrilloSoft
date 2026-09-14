"use client";

import SeguirButton from "./seguir-button";
import { IconExternal, IconShare } from "./icons";
import { Button } from "@/components/ui/button";

/**
 * La barra de acciones de un proceso en el teléfono: fija sobre la tab bar,
 * con lo único que se puede hacer desde aquí —seguirlo, compartirlo y ofertar
 * en el portal—. En escritorio no existe: allí las acciones están en la
 * cabecera de la ficha, a la vista.
 */
export default function AccionesProceso({
  codigo,
  titulo,
  url,
}: {
  codigo: string;
  titulo: string;
  url?: string;
}) {
  const compartir = async () => {
    const link = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url: link });
      } catch {
        /* usuario canceló */
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${titulo} ${link}`)}`,
        "_blank",
      );
    }
  };

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-hairline bg-surface px-4 py-3 shadow-pop lg:hidden"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2">
        <SeguirButton codigo={codigo} variant="bar" />
        <Button
          variant="secondary"
          size="icon"
          onClick={compartir}
          className="h-12 w-12"
        >
          <IconShare className="h-5 w-5" />
          <span className="sr-only">Compartir</span>
        </Button>
        {url && (
          <Button asChild className="h-12 flex-1">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Ofertar
              <IconExternal className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
