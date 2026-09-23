"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CampoBusqueda } from "@/components/campo-busqueda";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hrefDirectorio, type FiltrosDirectorio } from "./href";

const TODAS = "__todas";

/**
 * Nombre y demarcación: los dos filtros que no caben como enlaces.
 *
 * La búsqueda es por nombre dentro del directorio ya leído —no una consulta
 * nueva al SIL—, y por eso la ayuda dice exactamente eso. La provincia son 34
 * demarcaciones: como fila de enlaces ocuparía media pantalla del teléfono, va
 * en un `Select`, y al elegir navega igual que un enlace.
 */
export default function FiltrosLegisladores({
  filtros,
  provincias,
  total,
}: {
  filtros: FiltrosDirectorio;
  provincias: { nombre: string; cuantos: number }[];
  total: number;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(filtros.q);
  const [pendiente, startTransition] = useTransition();

  const ir = (cambio: Partial<FiltrosDirectorio>) =>
    startTransition(() => router.push(hrefDirectorio({ ...filtros, ...cambio })));

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_16rem] sm:items-start">
      <CampoBusqueda
        valor={valor}
        onValor={setValor}
        onEnviar={(q) => ir({ q })}
        onLimpiar={() => {
          setValor("");
          ir({ q: "" });
        }}
        etiqueta="Buscar un legislador por nombre"
        placeholder="Nombre o apellido"
        ayuda={`Busca por nombre entre los ${total} legisladores del directorio del SIL, sin importar tildes.`}
        pendiente={pendiente}
      />
      <div>
        <Label className="text-xs text-ink-soft">Provincia o demarcación</Label>
        <Select
          value={filtros.provincia || TODAS}
          onValueChange={(v) => ir({ provincia: v === TODAS ? "" : v })}
        >
          <SelectTrigger aria-label="Provincia o demarcación" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS} ayuda="Las 32 provincias, la lista nacional y el exterior.">
              Todo el país
            </SelectItem>
            {provincias.map((p) => (
              <SelectItem key={p.nombre} value={p.nombre}>
                {`${p.nombre} (${p.cuantos})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
