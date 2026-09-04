"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import ProcesoCard from "@/components/proceso-card";
import { getSeguimiento, onSeguimientoCambio } from "@/lib/seguimiento";
import { IconSearch, IconStar } from "@/components/icons";

export default function SeguimientoPage() {
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const sync = () => setCodigos(getSeguimiento());
    sync();
    return onSeguimientoCambio(sync);
  }, []);

  useEffect(() => {
    if (codigos === null) return;
    if (codigos.length === 0) {
      setProcesos([]);
      setCargando(false);
      return;
    }
    let cancel = false;
    setCargando(true);
    Promise.all(
      codigos.map((c) =>
        fetch(`/api/procesos?proceso=${encodeURIComponent(c)}&limit=1`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.content?.[0] ?? null)
          .catch(() => null)
      )
    ).then((res) => {
      if (cancel) return;
      const ok = res.filter((p): p is Proceso => p !== null);
      // Los que cierran antes, primero.
      ok.sort(
        (a, b) =>
          new Date(a.fecha_fin_recepcion_ofertas).getTime() -
          new Date(b.fecha_fin_recepcion_ofertas).getTime()
      );
      setProcesos(ok);
      setCargando(false);
    });
    return () => {
      cancel = true;
    };
  }, [codigos]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-surface p-5 border border-hairline">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <IconStar className="h-5 w-5 text-alerta-500" filled />
          Mi seguimiento
          {procesos.length > 0 && (
            <span className="ml-1 rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-soft">
              {procesos.length}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Los procesos que marcaste con la estrella, ordenados por cierre más próximo.
          Se guardan en este navegador.
        </p>
      </section>

      {cargando ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-44 rounded-lg border border-hairline" />
          ))}
        </div>
      ) : procesos.length === 0 ? (
        <div className="rounded-lg bg-surface p-12 text-center border border-hairline">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-hairline bg-canvas text-ink-soft">
            <IconStar className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-ink">Aún no sigues ningún proceso</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            Marca la estrella en cualquier tarjeta o ficha para guardarlo aquí y
            seguir su cierre.
          </p>
          <Link
            href="/licitaciones"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-canvas transition hover:bg-brand-700 active:scale-95"
          >
            <IconSearch className="h-4 w-4" />
            Ir al buscador
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {procesos.map((p) => (
            <ProcesoCard key={p.codigo_proceso} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
