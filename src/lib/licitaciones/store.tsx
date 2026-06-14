"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type {
  BusquedaGuardada,
  Etapa,
  FiltrosBusqueda,
  SeguimientoItem,
} from "./types";

/**
 * Client-side persistence for the things a user curates: tracked tenders (with
 * a workflow stage + private note) and saved searches with alert toggles.
 *
 * The platform ships as a static deployment, so this lives in localStorage,
 * exposed through an external store + `useSyncExternalStore` (SSR-safe, no
 * effect-driven hydration). The hook surface matches what a server-backed store
 * would expose, so it can be swapped for an API/Supabase layer later.
 */

const STORAGE_KEY = "licitard:v1";

interface State {
  seguimiento: SeguimientoItem[];
  busquedas: BusquedaGuardada[];
}

const EMPTY: State = { seguimiento: [], busquedas: [] };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function loadFromStorage(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      seguimiento: parsed.seguimiento ?? [],
      busquedas: parsed.busquedas ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  state = loadFromStorage();
  loaded = true;
}

function emit() {
  for (const l of listeners) l();
}

function commit(next: State) {
  state = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  emit();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  // Keep multiple tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = loadFromStorage();
      emit();
    }
  };
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): State {
  ensureLoaded();
  return state;
}

function getServerSnapshot(): State {
  return EMPTY;
}

// --- Mutators (stable module-level functions) ------------------------------

function track(id: string, etapa: Etapa = "interesada") {
  if (state.seguimiento.some((s) => s.licitacionId === id)) return;
  commit({
    ...state,
    seguimiento: [
      { licitacionId: id, etapa, agregada: new Date().toISOString() },
      ...state.seguimiento,
    ],
  });
}

function untrack(id: string) {
  commit({
    ...state,
    seguimiento: state.seguimiento.filter((s) => s.licitacionId !== id),
  });
}

function toggleTrack(id: string) {
  if (state.seguimiento.some((s) => s.licitacionId === id)) untrack(id);
  else track(id);
}

function setEtapa(id: string, etapa: Etapa) {
  commit({
    ...state,
    seguimiento: state.seguimiento.map((s) =>
      s.licitacionId === id ? { ...s, etapa } : s,
    ),
  });
}

function setNota(id: string, nota: string) {
  commit({
    ...state,
    seguimiento: state.seguimiento.map((s) =>
      s.licitacionId === id ? { ...s, nota } : s,
    ),
  });
}

function saveBusqueda(nombre: string, filtros: FiltrosBusqueda, alerta: boolean) {
  commit({
    ...state,
    busquedas: [
      {
        id: `b-${Date.now()}`,
        nombre,
        filtros,
        alerta,
        creada: new Date().toISOString(),
      },
      ...state.busquedas,
    ],
  });
}

function removeBusqueda(id: string) {
  commit({ ...state, busquedas: state.busquedas.filter((b) => b.id !== id) });
}

function toggleAlerta(id: string) {
  commit({
    ...state,
    busquedas: state.busquedas.map((b) =>
      b.id === id ? { ...b, alerta: !b.alerta } : b,
    ),
  });
}

// --- Hooks -----------------------------------------------------------------

const emptySubscribe = () => () => {};

/** True only after client hydration — for SSR-safe placeholders. */
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function useTracker() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useHydrated();

  return {
    hydrated,
    seguimiento: snap.seguimiento,
    busquedas: snap.busquedas,
    isTracked: (id: string) => snap.seguimiento.some((s) => s.licitacionId === id),
    getItem: (id: string) => snap.seguimiento.find((s) => s.licitacionId === id),
    track,
    untrack,
    toggleTrack,
    setEtapa,
    setNota,
    saveBusqueda,
    removeBusqueda,
    toggleAlerta,
  };
}

/**
 * Kept for API symmetry — the store is a module singleton, so this is a simple
 * passthrough that can later host a real provider/context if needed.
 */
export function TrackerProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
