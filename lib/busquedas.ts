"use client";

/**
 * Saved searches, persisted in localStorage. A saved search stores the URL query
 * string of the buscador filters, so applying one is just navigating to `/?qs`
 * (the home page rehydrates its filters from the URL). Changes broadcast a
 * custom event so the header menu and the buscador stay in sync, mirroring the
 * seguimiento store.
 */

const KEY = "lrd:busquedas";
const EVENTO = "lrd:busquedas-cambio";
const MAX = 16;

export interface Busqueda {
  id: string;
  nombre: string;
  qs: string;
  creada: string;
}

export function getBusquedas(): Busqueda[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list: Busqueda[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENTO));
}

export function addBusqueda(nombre: string, qs: string): Busqueda[] {
  const item: Busqueda = {
    id: `b-${Date.now()}`,
    nombre: nombre.trim() || "Búsqueda",
    qs,
    creada: new Date().toISOString(),
  };
  // Avoid exact duplicates (same querystring).
  const list = [item, ...getBusquedas().filter((b) => b.qs !== qs)].slice(0, MAX);
  persist(list);
  return list;
}

export function removeBusqueda(id: string): Busqueda[] {
  const list = getBusquedas().filter((b) => b.id !== id);
  persist(list);
  return list;
}

export function onBusquedasCambio(cb: () => void): () => void {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}
