"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { IconDoc, IconDownload, IconExternal } from "@/components/icons";
import { Button } from "@/components/ui/button";

// pdf.js pesa: entra solo cuando alguien abre de verdad un documento.
const LectorPdf = dynamic(() => import("@/components/lector-pdf"), { ssr: false });

interface Props {
  /** URL pública del archivo en el origen oficial: enlaces y descarga. */
  url: string;
  /**
   * URL desde la que el lector puede leer los bytes. Es obligatoria en la
   * práctica porque ninguna fuente del Estado envía CORS: siempre es
   * `/api/documento?url=…`. Los enlaces siguen apuntando al origen.
   */
  urlVisor?: string;
  nombre: string;
  tipo: string | null;
  bytes: number | null;
  /** Origen que lo publica, para dejarlo dicho junto al visor. */
  origen: string;
  /** El origen publica imágenes sin capa de texto: se advierte antes de abrir. */
  escaneo?: boolean;
}

function pesoLegible(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Vista previa de un documento oficial. Se usa igual en toda la plataforma:
 * expedientes del Congreso, pliegos de la DGCP y normativa del Ejecutivo.
 *
 * Tres reglas fijas:
 *
 *  1. **No se carga sola.** Hay expedientes que son escaneos de decenas de
 *     megabytes; abrirlos por defecto castigaría cualquier conexión móvil. Se
 *     declara el peso y el lector aparece bajo demanda.
 *  2. **Se dibuja, no se incrusta.** Un `<iframe>` con un PDF no renderiza en
 *     móvil: pinta un cajón con un botón «Abrir» que saca al lector de la
 *     página. `LectorPdf` rasteriza con pdf.js y se comporta igual en todas
 *     partes.
 *  3. **Los enlaces apuntan al origen.** Aunque los bytes lleguen por una ruta
 *     propia, «abrir» y «descargar» llevan al archivo del Estado: nadie tiene
 *     que confiar en una copia nuestra.
 */
export default function VisorDocumento({
  url,
  urlVisor,
  nombre,
  tipo,
  bytes,
  origen,
  escaneo,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const peso = pesoLegible(bytes);
  const esPdf = (tipo ?? "").includes("pdf") || /\.pdf$/i.test(url);

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 px-5 py-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-canvas text-ink-soft">
          <IconDoc className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{nombre}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {[esPdf ? "PDF" : tipo, peso, origen].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/*
        Tres mandos de talla `sm` —36 px— que en un teléfono caían en dos
        líneas desiguales, por debajo del objetivo táctil y con la acción
        principal indistinguible de las dos que sacan de la plataforma. Ahora
        leer aquí ocupa el ancho entero, y abrir y descargar se reparten la
        línea de abajo a medias: tres objetivos de 44 px que se aciertan con el
        pulgar. Desde `sm` vuelven a ser tres mandos en fila.
      */}
      <div className="flex flex-col gap-2 px-5 pb-4 sm:flex-row sm:flex-wrap">
        {esPdf && (
          <Button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="w-full sm:w-auto"
          >
            {abierto ? "Ocultar el documento" : "Leer el documento aquí"}
          </Button>
        )}
        <div className="flex gap-2">
          {/*
            «Abrir en el origen» y no «en pestaña nueva»: en una herramienta de
            verificación importa **a dónde** lleva —al archivo del Estado, no a
            una copia nuestra— más que en qué pestaña se abre, y de paso cabe
            en media línea de teléfono. Es además el mismo rótulo con que el
            lector ofrece la salida cuando no puede dibujar el PDF.
          */}
          <Button
            asChild
            variant="secondary"
            className="flex-1 px-3 text-xs sm:flex-none sm:px-4 sm:text-sm"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Abrir en el origen
              <IconExternal className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="flex-1 px-3 text-xs sm:flex-none sm:px-4 sm:text-sm"
          >
            <a href={url} download>
              Descargar
              <IconDownload className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {abierto && esPdf && (
        <div className="border-t border-hairline">
          {/*
            El aviso de escaneo no es decoración: explica por qué el buscador
            del lector no encontrará nada dentro del documento. A 11 px se leía
            como letra pequeña de contrato; sube a 12, el suelo de la casa para
            un metadato.
          */}
          {(peso || escaneo) && (
            <p className="bg-canvas/60 px-5 py-2 text-xs leading-relaxed text-ink-soft">
              {peso && `${peso} · servido desde ${origen}.`}
              {escaneo &&
                " Es un escaneo: el texto no se puede buscar ni copiar, porque así lo publica el Estado."}
            </p>
          )}
          <LectorPdf url={urlVisor ?? url} urlOrigen={url} />
        </div>
      )}
    </div>
  );
}
