"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getRecientes, pushReciente } from "@/lib/recientes";
import {
  addBusqueda,
  getBusquedas,
  onBusquedasCambio,
  removeBusqueda,
  type Busqueda,
} from "@/lib/busquedas";
import {
  IconBookmark,
  IconClock,
  IconCoins,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconX,
} from "./icons";

/**
 * Intelligent top-bar search. Lives in the global header and is the single
 * entry point for search + quick filtering across the app. It drives the
 * buscador purely through the URL (the app's source of truth): typing updates
 * `?q=`, quick filters set/clear params, and saved/recent searches navigate to
 * a full querystring. Works from any page (navigates to the buscador when
 * needed) — that buscador now lives at `/licitaciones`, since `/` is the
 * panorama of the whole platform.
 */
const BUSCADOR = "/licitaciones";

export default function TopSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const spq = sp.get("q") ?? "";

  const [text, setText] = useState(spq);
  const [open, setOpen] = useState(false);
  const [recientes, setRecientes] = useState<string[]>([]);
  const [busquedas, setBusquedas] = useState<Busqueda[]>([]);
  const focused = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecientes(getRecientes());
    const sync = () => setBusquedas(getBusquedas());
    sync();
    return onBusquedasCambio(sync);
  }, []);

  // Reflect URL → input, except while the user is typing.
  useEffect(() => {
    if (!focused.current) setText(spq);
  }, [spq]);

  // Debounced search-as-you-type → URL.
  useEffect(() => {
    if (text === spq) return;
    const t = setTimeout(() => {
      navWith((p) => {
        const v = text.trim();
        if (v) p.set("q", v);
        else p.delete("q");
      });
      if (text.trim().length >= 3) setRecientes(pushReciente(text.trim()));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, spq]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function navWith(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    mutate(p);
    const qs = p.toString();
    const url = `${BUSCADOR}${qs ? `?${qs}` : ""}`;
    if (pathname === BUSCADOR) router.replace(url);
    else router.push(url);
  }

  function reset() {
    setText("");
    if (pathname === BUSCADOR) router.replace(BUSCADOR);
    else router.push(BUSCADOR);
  }

  function aplicarTermino(term: string) {
    setText(term);
    navWith((p) => {
      const v = term.trim();
      if (v) p.set("q", v);
      else p.delete("q");
    });
    if (term.trim().length >= 3) setRecientes(pushReciente(term.trim()));
    setOpen(false);
    inputRef.current?.blur();
  }

  function aplicarGuardada(b: Busqueda) {
    router.push(`${BUSCADOR}${b.qs ? `?${b.qs}` : ""}`);
    setOpen(false);
  }

  function guardarActual() {
    const qs = typeof window !== "undefined"
      ? window.location.search.replace(/^\?/, "")
      : "";
    setBusquedas(addBusqueda(text.trim() || spq || "Búsqueda", qs));
  }

  const presets: { label: string; Icon: typeof IconClock; run: () => void }[] = [
    { label: "Abiertas ahora", Icon: IconSparkles, run: reset },
    {
      label: "Cierran pronto",
      Icon: IconClock,
      run: () => navWith((p) => { p.delete("estado"); p.set("orden", "cierre"); }),
    },
    {
      label: "Mayor monto",
      Icon: IconCoins,
      run: () => navWith((p) => p.set("orden", "monto_desc")),
    },
    {
      label: "Para MIPYMES",
      Icon: IconSparkles,
      run: () => navWith((p) => { p.delete("estado"); p.set("mipyme", "1"); }),
    },
  ];

  return (
    <div ref={wrap} className="relative w-full max-w-xl">
      <div className="group flex items-center gap-2 rounded-full bg-white/10 px-3 ring-1 ring-inset ring-white/15 transition focus-within:bg-white focus-within:ring-white/30">
        <IconSearch className="h-[18px] w-[18px] shrink-0 text-slate-300 transition-colors group-focus-within:text-ink" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => {
            focused.current = true;
            setOpen(true);
          }}
          onBlur={() => {
            focused.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") aplicarTermino(text);
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Buscar licitaciones…"
          aria-label="Buscar licitaciones"
          className="h-10 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-slate-400 focus:text-ink focus:placeholder:text-ink-soft/50"
        />
        {text && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              reset();
              inputRef.current?.focus();
            }}
            aria-label="Limpiar"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-300 transition hover:text-white group-focus-within:text-ink-soft active:scale-90"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl bg-surface text-ink shadow-pop ring-1 ring-hairline">
          <div className="border-b border-hairline p-2">
            <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
              Filtros rápidos
            </div>
            <div className="flex flex-wrap gap-1.5 p-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    p.run();
                    setOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-brand-50 hover:text-brand-700 active:scale-95"
                >
                  <p.Icon className="h-3.5 w-3.5" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {recientes.length > 0 && (
            <div className="border-b border-hairline p-1.5">
              <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                Recientes
              </div>
              {recientes.slice(0, 5).map((t) => (
                <button
                  key={t}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    aplicarTermino(t);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-slate-50"
                >
                  <IconClock className="h-4 w-4 shrink-0 text-ink-soft" />
                  <span className="truncate">{t}</span>
                </button>
              ))}
            </div>
          )}

          <div className="p-1.5">
            <div className="flex items-center justify-between px-2.5 pb-1 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                Guardadas
              </span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  guardarActual();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
              >
                <IconBookmark className="h-3.5 w-3.5" />
                Guardar actual
              </button>
            </div>
            {busquedas.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-ink-soft">
                Aún no tienes búsquedas guardadas.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto">
                {busquedas.map((b) => (
                  <li key={b.id} className="flex items-center gap-1">
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        aplicarGuardada(b);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-slate-50"
                    >
                      <IconBookmark className="h-4 w-4 shrink-0 text-brand-600" filled />
                      <span className="truncate font-medium">{b.nombre}</span>
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setBusquedas(removeBusqueda(b.id));
                      }}
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
        </div>
      )}
    </div>
  );
}
