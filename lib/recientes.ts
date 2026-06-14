"use client";

const KEY = "lrd:recientes";
const MAX = 6;

export function getRecientes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Add a term to the front of the recent list (deduped, capped). */
export function pushReciente(term: string): string[] {
  const t = term.trim();
  if (!t) return getRecientes();
  const next = [t, ...getRecientes().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearRecientes() {
  window.localStorage.removeItem(KEY);
}
