"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import ProcesoCard from "@/components/proceso-card";
import { getSeguimiento, onSeguimientoCambio } from "@/lib/seguimiento";

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
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">★ Mi seguimiento</h1>
        <p className="mt-1 text-sm text-slate-500">
          Los procesos que marcaste con la estrella, ordenados por cierre más próximo.
          Se guardan en este navegador.
        </p>
      </section>

      {cargando ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
            />
          ))}
        </div>
      ) : procesos.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-500">
            Aún no sigues ningún proceso. Marca la estrella ☆ en cualquier tarjeta para
            guardarlo aquí.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
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
