import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getObras } from "@/lib/obras";
import { getCombustibles } from "@/lib/combustibles";
import { getTasa } from "@/lib/tasa";
import { formatFecha } from "@/lib/format";
import { formatInt } from "@/lib/nomina";

/**
 * Las cifras vivas de cada instantánea nueva, para `/fuentes`: cuántos
 * registros trae y a qué fecha corresponde. Viven aquí y no en la página para
 * que declarar una fuente sea una línea en `app/fuentes/page.tsx`.
 */
export async function ResumenObras() {
  const d = await getObras();
  if (!d) return <>La instantánea no está disponible ahora mismo.</>;
  const conContratos = d.proyectos.filter((o) => o.nContratos > 0).length;
  const conInstitucion = d.proyectos.filter((o) => o.uc !== null).length;
  return (
    <>
      Instantánea con corte al {formatFecha(d.corte)}: {formatInt(d.proyectos.length)} proyectos,{" "}
      {formatInt(conContratos)} con contratos asociados y {formatInt(conInstitucion)} atados a
      una institución de la plataforma.
    </>
  );
}

export async function ResumenRnc() {
  try {
    const m = JSON.parse(
      await readFile(join(process.cwd(), "public", "data", "rnc", "meta.json"), "utf8"),
    ) as { corteDgii: string | null; proveedores: number; conRnc: number; enPadron: number; padron: number };
    return (
      <>
        Padrón{m.corteDgii ? ` al ${formatFecha(m.corteDgii)}` : ""} ({formatInt(m.padron)}{" "}
        contribuyentes): {formatInt(m.enPadron)} de los {formatInt(m.conRnc)} proveedores con RNC
        de empresa están en él, de {formatInt(m.proveedores)} inscritos en el registro.
      </>
    );
  } catch {
    return <>La instantánea no está disponible ahora mismo.</>;
  }
}

export async function ResumenCombustibles() {
  const c = await getCombustibles();
  if (!c) return <>Ahora mismo la portada no contestó o cambió de forma.</>;
  return (
    <>
      Última lectura: {c.precios.length} precios
      {c.semana ? `, semana del ${c.semana}` : ""}.
    </>
  );
}

export async function ResumenTasa() {
  const t = await getTasa();
  if (!t) return <>Ahora mismo el archivo no contestó.</>;
  return <>Último dato: {formatFecha(t.ultimo.fecha)}.</>;
}
