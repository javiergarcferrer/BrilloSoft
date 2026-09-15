"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import ProcesoCard from "@/components/proceso-card";
import { getSeguimiento, onSeguimientoCambio } from "@/lib/seguimiento";
import { IconSearch, IconStar } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVacio } from "@/components/estado-vacio";

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
      <Card as="section" className="p-5">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <IconStar className="h-5 w-5 text-alerta-500" filled />
          Mi seguimiento
          {procesos.length > 0 && (
            <Badge forma="etiqueta" className="ml-1">
              {procesos.length}
            </Badge>
          )}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Los procesos que marcaste con la estrella, ordenados por cierre más próximo.
          Se guardan en este navegador.
        </p>
      </Card>

      {cargando ? (
        /*
          La silueta mide lo que mide una tarjeta de proceso en un teléfono
          —unos 208 px—, no los 176 de antes: con la altura corta, la lista
          daba un tirón hacia abajo al llegar los datos.
        */
        <div className="grid gap-3 md:grid-cols-2" role="status" aria-busy="true">
          <span className="sr-only">Cargando los procesos que sigues…</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg border border-hairline" />
          ))}
        </div>
      ) : procesos.length === 0 ? (
        <EstadoVacio
          titulo="Aún no sigues ningún proceso"
          accion={
            <Button asChild>
              <Link href="/licitaciones">
                <IconSearch className="h-4 w-4" />
                Ir al buscador
              </Link>
            </Button>
          }
        >
          Marca la estrella en cualquier tarjeta o ficha para guardarlo aquí y
          seguir su cierre.
        </EstadoVacio>
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
