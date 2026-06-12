"use client";

const KEY = "lrd:seguimiento";
const EVENTO = "lrd:seguimiento-cambio";

export function getSeguimiento(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function toggleSeguimiento(codigo: string): string[] {
  const list = getSeguimiento();
  const next = list.includes(codigo)
    ? list.filter((c) => c !== codigo)
    : [...list, codigo];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENTO));
  return next;
}

export function onSeguimientoCambio(cb: () => void): () => void {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}
