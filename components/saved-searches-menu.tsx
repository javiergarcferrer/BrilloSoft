"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getBusquedas,
  onBusquedasCambio,
  removeBusqueda,
  type Busqueda,
} from "@/lib/busquedas";
import { IconBookmark, IconTrash } from "./icons";

/** Header dropdown of saved searches. Each item links to the home page with the
 *  saved query string; the buscador rehydrates its filters from the URL. */
export default function SavedSearchesMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Busqueda[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setItems(getBusquedas());
    sync();
    return onBusquedasCambio(sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Búsquedas guardadas"
        className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
      >
        <IconBookmark className="h-4 w-4" filled={items.length > 0} />
        <span className="hidden sm:inline">Guardadas</span>
        {items.length > 0 && (
          <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-surface text-ink shadow-pop ring-1 ring-hairline">
          <div className="border-b border-hairline px-4 py-2.5 text-sm font-semibold">
            Búsquedas guardadas
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-5 text-sm text-ink-soft">
              Guarda una búsqueda desde el buscador con el botón{" "}
              <span className="font-medium text-ink">Guardar</span> para verla aquí.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((b) => (
                <li key={b.id} className="flex items-center gap-1 px-2">
                  <Link
                    href={`/${b.qs ? `?${b.qs}` : ""}`}
                    onClick={() => setOpen(false)}
                    className="min-w-0 flex-1 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="block truncate font-medium">{b.nombre}</span>
                  </Link>
                  <button
                    onClick={() => removeBusqueda(b.id)}
                    aria-label="Eliminar"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
