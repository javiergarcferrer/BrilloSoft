"use client";

import { useState } from "react";
import { IconDoc, IconDownload, IconExternal } from "@/components/icons";

interface Props {
  /** URL pública del archivo en el origen oficial. */
  url: string;
  nombre: string;
  tipo: string | null;
  bytes: number | null;
  /** Origen que lo publica, para dejarlo dicho junto al visor. */
  origen: string;
}

function pesoLegible(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Vista previa del documento oficial.
 *
 * No se carga sola: estos expedientes son escaneos que pasan de 20 MB y
 * abrirlos por defecto castigaría cualquier conexión móvil. Se declara el peso
 * y el visor aparece bajo demanda, embebido desde el propio origen (que sirve
 * el archivo sin `X-Frame-Options`) para que nadie tenga que confiar en una
 * copia nuestra: los bytes vienen del Estado.
 */
export default function VisorDocumento({ url, nombre, tipo, bytes, origen }: Props) {
  const [abierto, setAbierto] = useState(false);
  const peso = pesoLegible(bytes);
  const esPdf = (tipo ?? "").includes("pdf") || /\.pdf$/i.test(url);

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 px-5 py-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <IconDoc className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{nombre}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {[esPdf ? "PDF" : tipo, peso, origen].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {esPdf && (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {abierto ? "Ocultar el documento" : "Leer el documento aquí"}
          </button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-canvas"
        >
          Abrir en pestaña nueva
          <IconExternal className="h-3.5 w-3.5" />
        </a>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-canvas"
        >
          Descargar
          <IconDownload className="h-3.5 w-3.5" />
        </a>
      </div>

      {abierto && esPdf && (
        <div className="border-t border-hairline">
          {peso && (
            <p className="bg-canvas/60 px-5 py-2 text-[11px] text-ink-soft">
              Cargando {peso} desde {origen}. Es un escaneo: el texto no se puede
              buscar ni copiar, porque así lo publica el Estado.
            </p>
          )}
          <iframe
            src={url}
            title={`Documento: ${nombre}`}
            className="h-[70vh] w-full border-0 bg-canvas"
          />
        </div>
      )}
    </div>
  );
}
