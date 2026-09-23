"use client";

import { IconDownload } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { celda } from "@/lib/csv";

/**
 * Descarga la tabla que se está viendo, con los filtros ya aplicados.
 *
 * El archivo se arma en el navegador (un `Blob`, como el de
 * `components/nomina/explorer.tsx`): el servidor ya calculó las filas y no hay
 * una ruta de API que mantener. Las cifras van en pesos enteros y sin
 * separador de miles, que es lo que una hoja de cálculo sabe sumar; el BOM al
 * inicio hace que Excel lea las tildes en UTF-8.
 */
export function DescargarCsv({
  encabezado,
  filas,
  nombre,
  etiqueta,
}: {
  encabezado: string[];
  filas: (string | number)[][];
  nombre: string;
  etiqueta: string;
}) {
  const descargar = () => {
    const texto = [encabezado, ...filas].map((f) => f.map(celda).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" variant="secondary" onClick={descargar}>
      <IconDownload className="h-4 w-4" />
      {etiqueta}
    </Button>
  );
}
