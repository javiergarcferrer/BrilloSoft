/**
 * El vocabulario del Estado, traducido en el punto de uso.
 *
 * `IDENTIDAD.md` obliga a explicar «perimió» antes de usarlo. Un glosario
 * aparte no cumple eso: nadie abre un glosario. La traducción tiene que estar
 * pegada a la palabra, la primera vez que aparece y todas las demás.
 *
 * Regla de redacción: **primero lo que el término hace, después cómo se
 * llama.** «Se archiva si no avanza (perime)», no «perime (se archiva)».
 */
export interface Glosa {
  /** Qué es, en una frase que se entienda sin haber estudiado derecho. */
  llano: string;
  /** Nombre corto para sustituir la jerga como etiqueta principal, si procede. */
  enLlano?: string;
}

export const GLOSARIO: Record<string, Glosa> = {
  perencion: {
    llano:
      "Si una pieza no completa su trámite antes de que cierre la legislatura, se archiva y hay que volver a depositarla desde cero. El Congreso lo llama perención.",
    enLlano: "Se archivan al cerrar",
  },
  perime: {
    llano:
      "Se archiva si no avanza antes de que cierre la legislatura. Para revivirla habría que depositarla otra vez desde cero.",
    enLlano: "Se archiva en",
  },
  legislatura: {
    llano:
      "Cada uno de los dos períodos de sesiones que el Congreso abre al año: 150 días desde el 27 de febrero y desde el 16 de agosto.",
  },
  cuatrienio: {
    llano:
      "El período de cuatro años de un Congreso, entre elección y elección. Cada cuatrienio guarda sus expedientes por separado.",
  },
  rpe: {
    llano:
      "Registro de Proveedores del Estado: el número con el que una empresa queda habilitada para venderle al Estado.",
  },
  spnf: {
    llano:
      "Sector Público No Financiero: el gobierno central y sus instituciones. No incluye el Banco Central ni la banca pública.",
  },
  condicion: {
    llano:
      "El SIL lleva dos taxonomías a la vez, «condición» y «estado», y no siempre coinciden. Esta es la condición procesal que declara la cámara.",
  },
  promulgacion: {
    llano:
      "La firma del Presidente que convierte en ley lo que aprobó el Congreso. Sin ella, la pieza no obliga a nadie.",
  },
  observacion: {
    llano:
      "El Presidente devolvió la pieza al Congreso con reparos en vez de promulgarla. El Congreso puede acogerlos o insistir.",
  },
  masaSalarial: {
    llano:
      "Lo que suman todos los sueldos brutos de un mes. No incluye pensiones, contratistas ni incentivos fuera de nómina.",
  },
  plaza: {
    llano: "Un puesto de trabajo con su sueldo, tal como lo publica la institución.",
  },
  modalidad: {
    llano:
      "El procedimiento por el que se compra: cada uno tiene sus umbrales de monto y sus reglas de publicidad.",
  },
  montoEstimado: {
    llano:
      "Lo que la institución calcula que costará, antes de recibir ofertas. El monto finalmente adjudicado suele ser distinto.",
  },
};

export function glosa(clave: keyof typeof GLOSARIO | string): string | null {
  return GLOSARIO[clave]?.llano ?? null;
}
