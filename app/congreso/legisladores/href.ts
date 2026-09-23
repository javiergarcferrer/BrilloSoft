/** Filtros del directorio de legisladores. Todo vive en la URL y se comparte. */
export interface FiltrosDirectorio {
  q: string;
  provincia: string;
  partido: string;
  camara: string;
}

/** La URL del directorio con estos filtros: todo vive en la URL y se comparte. */
export function hrefDirectorio(f: Partial<FiltrosDirectorio>): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.camara) sp.set("camara", f.camara);
  if (f.provincia) sp.set("provincia", f.provincia);
  if (f.partido) sp.set("partido", f.partido);
  const qs = sp.toString();
  return `/congreso/legisladores${qs ? `?${qs}` : ""}`;
}
