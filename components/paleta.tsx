"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSQUEDAS,
  PAGINAS_PLATAFORMA,
  SECCIONES,
  seccionDe,
  type DestinoBusqueda,
} from "@/lib/secciones";
import { getBusquedas, onBusquedasCambio, type Busqueda } from "@/lib/busquedas";
import { getRecientes } from "@/lib/recientes";
import { cn } from "@/lib/cn";
import { IconArrowRight, IconBookmark, IconClock, IconSearch } from "./icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

/**
 * La paleta: «¿a dónde vas?» desde cualquier página.
 *
 * Hasta aquí, llegar a una vista de otra vertical costaba recordar en qué
 * vertical vivía —«Perención» cuelga de Congreso, «Planes» de Licitaciones—,
 * abrirla y buscar la pestaña; y buscar un texto fuera de licitaciones costaba
 * saber que proveedores y las dos cámaras tienen su propio campo. La paleta
 * sostiene eso por el lector (docs/IDENTIDAD.md §3, reconocer y no recordar):
 * toda la arquitectura de `lib/secciones` en una lista que se filtra al
 * teclear, y el texto tecleado ofrecido a **cada** búsqueda de la plataforma.
 *
 * Lo que no hace es fingir un buscador global. La plataforma no tiene índice
 * propio —no tiene base de datos, y no la va a tener—, así que no hay «buscar
 * en todo»: hay una fila por destino y cada una dice debajo qué recorre. Es la
 * trampa que `header-search.tsx` documenta, evitada al revés: el alcance no
 * se esconde tras un campo único, se declara en cada opción.
 *
 * Se abre con el botón del header, con ⌘K / Ctrl K y con «/» fuera de un
 * campo, que es la tecla que la web ya enseñó para buscar.
 */
export default function Paleta() {
  const router = useRouter();
  const pathname = usePathname();
  const actual = seccionDe(pathname);

  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");
  const [recientes, setRecientes] = useState<string[]>([]);
  const [guardadas, setGuardadas] = useState<Busqueda[]>([]);
  const [atajo, setAtajo] = useState("Ctrl K");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setAtajo("⌘K");
    const sync = () => setGuardadas(getBusquedas());
    sync();
    return onBusquedasCambio(sync);
  }, []);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierta((v) => !v);
        return;
      }
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      // «/» dentro de un campo es una barra que se está escribiendo.
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      setAbierta(true);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  // Al abrir: lo tecleado la vez anterior no sirve, lo reciente sí.
  useEffect(() => {
    if (!abierta) return;
    setTexto("");
    setRecientes(getRecientes());
  }, [abierta]);

  // Instituciones que coinciden, pedidas al servidor a medida que se teclea:
  // el cruce entero no viaja al navegador.
  const [sugeridas, setSugeridas] = useState<{ href: string; nombre: string; detalle: string }[]>([]);
  useEffect(() => {
    const q = texto.trim();
    if (!abierta || q.length < 2) {
      setSugeridas([]);
      return;
    }
    const control = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/instituciones?q=${encodeURIComponent(q)}`, { signal: control.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((filas) => setSugeridas(Array.isArray(filas) ? filas : []))
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      control.abort();
    };
  }, [texto, abierta]);

  const ir = (href: string) => {
    setAbierta(false);
    router.push(href);
  };

  const consulta = texto.trim();
  const sinSeccion =
    !!consulta &&
    !SECCIONES.some((sec) =>
      sec.vistas.some((v) =>
        coincide(consulta, [sec.nombre, v.label, sec.pregunta, sec.descriptor]),
      ),
    ) &&
    !PAGINAS_PLATAFORMA.some((p) => coincide(consulta, [p.label, p.descriptor]));

  // La búsqueda de la vertical en la que ya está el lector va primero: es la
  // que más probablemente quería.
  // «Toda la plataforma» encabeza siempre: es la que no exige saber dónde vive
  // lo buscado.
  const peso = (d: DestinoBusqueda) =>
    d.href === "/buscar" ? 2 : Number(!!actual && d.seccion === actual.id);
  const destinos = [...BUSQUEDAS].sort((a, b) => peso(b) - peso(a));

  return (
    <Dialog open={abierta} onOpenChange={setAbierta}>
      <DialogTrigger
        aria-keyshortcuts="Meta+K Control+K /"
        className={cn(
          buttonVariants({ variant: "tinta", size: "icon" }),
          "lg:h-8 lg:w-auto lg:gap-2 lg:px-2.5 lg:text-[13px] lg:font-medium",
        )}
      >
        <IconSearch className="h-5 w-5 lg:h-4 lg:w-4" />
        <span className="sr-only lg:not-sr-only">Ir a…</span>
        <kbd className="hidden rounded-sm border border-canvas/25 px-1 font-mono text-[11px] text-canvas/65 xl:inline">
          {atajo}
        </kbd>
      </DialogTrigger>

      <DialogContent conCierre="telefono" aria-describedby="paleta-ayuda">
        <DialogTitle className="sr-only">Ir a una sección o buscar</DialogTitle>
        <DialogDescription id="paleta-ayuda" className="sr-only">
          Escribe el nombre de una sección o el texto que buscas. Flechas para
          recorrer, Intro para abrir, Escape para cerrar.
        </DialogDescription>

        <Command
          /*
            El filtro propio existe por una sola razón: las filas de «Buscar en…»
            no son opciones que se filtran, son el destino de lo tecleado, y
            tienen que seguir ahí con cualquier texto. El resto se filtra por
            subcadena normalizada —sin tildes, sin mayúsculas—, que es como
            teclea alguien en el teléfono: «nomina» encuentra «Nómina». Dentro
            de un grupo cmdk ordena por puntuación; entre grupos manda el
            marcado.
          */
          filter={(valor, busqueda, claves = []) => {
            if (valor.startsWith("buscar:")) return 1;
            // Solo las claves: el `value` lleva un prefijo técnico («ir:/…»)
            // y teclear «ir» encendía todas las filas. Las dos primeras claves
            // son el nombre de la fila; lo demás —la pregunta, el descriptor—
            // también encuentra, pero detrás: «senado» tiene que dar primero
            // «Congreso · Senado» y no «Diputados», cuyo descriptor lo nombra.
            if (coincide(busqueda, claves.slice(0, 2))) return 1;
            return coincide(busqueda, claves) ? 0.5 : 0;
          }}
          className="min-h-0 flex-1"
        >
          <CommandInput
            value={texto}
            onValueChange={setTexto}
            placeholder="Una sección, o lo que buscas…"
            enterKeyHint="go"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            // En el teléfono el aspa de cerrar vive al final de esta fila.
            className="pr-10 sm:pr-0"
          />
          <CommandList>
            {!consulta && (guardadas.length > 0 || recientes.length > 0) && (
              <>
                <CommandGroup heading="Tus búsquedas de licitaciones">
                  {guardadas.slice(0, 4).map((b) => (
                    <CommandItem
                      key={b.id}
                      value={`guardada:${b.id}`}
                      keywords={[b.nombre]}
                      onSelect={() => ir(`/licitaciones${b.qs ? `?${b.qs}` : ""}`)}
                    >
                      <IconBookmark className="h-4 w-4 text-brand-600" filled />
                      <span className="truncate font-medium">{b.nombre}</span>
                      <span className="ml-auto shrink-0 text-xs text-ink-soft">Guardada</span>
                    </CommandItem>
                  ))}
                  {recientes.slice(0, 3).map((t) => (
                    <CommandItem
                      key={t}
                      value={`reciente:${t}`}
                      keywords={[t]}
                      onSelect={() => ir(`/licitaciones?q=${encodeURIComponent(t)}`)}
                    >
                      <IconClock className="h-4 w-4 text-ink-soft" />
                      <span className="truncate">{t}</span>
                      <span className="ml-auto shrink-0 text-xs text-ink-soft">Reciente</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Secciones">
              {SECCIONES.flatMap((s) =>
                s.vistas.map((v, i) => {
                  const unica = s.vistas.length === 1;
                  return (
                    <CommandItem
                      key={v.href}
                      value={`ir:${v.href}`}
                      keywords={[s.nombre, v.label, s.pregunta, s.descriptor]}
                      onSelect={() => ir(v.href)}
                    >
                      <span
                        aria-hidden
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.hue.punto)}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{s.nombre}</span>
                        {!unica && <span className="text-ink-soft"> · {v.label}</span>}
                      </span>
                      {/* El descriptor de la vertical, una sola vez: en su primera vista. */}
                      {i === 0 && (
                        <span className="hidden shrink-0 text-xs text-ink-soft sm:inline">
                          {s.descriptor}
                        </span>
                      )}
                    </CommandItem>
                  );
                }),
              )}
            </CommandGroup>

            <CommandGroup heading="Plataforma">
              {PAGINAS_PLATAFORMA.map((p) => (
                <CommandItem
                  key={p.href}
                  value={`ir:${p.href}`}
                  keywords={[p.label, p.descriptor]}
                  onSelect={() => ir(p.href)}
                >
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <span className="min-w-0 flex-1 truncate font-medium">{p.label}</span>
                  <span className="hidden shrink-0 truncate text-xs text-ink-soft sm:inline">
                    {p.descriptor}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {consulta && sugeridas.length > 0 && (
              <CommandGroup heading="Instituciones">
                {sugeridas.map((i) => (
                  <CommandItem
                    key={i.href}
                    value={`buscar:inst:${i.href}`}
                    onSelect={() => ir(i.href)}
                  >
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                    <span className="min-w-0 flex-1 truncate font-medium">{i.nombre}</span>
                    <span className="hidden shrink-0 truncate text-xs text-ink-soft sm:inline">
                      {i.detalle}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/*
              «Buscar en…» va al final y no arriba. Si lo tecleado nombra una
              sección —«nomina», «senado»—, esa sección es la primera fila y es
              adonde lleva Intro; si no nombra ninguna, las secciones se filtran
              fuera y los destinos de búsqueda quedan solos, primeros. Se probó
              arriba con menor puntuación y cmdk no reordenó los grupos: el
              orden se decide aquí, en el marcado.
            */}
            {consulta && (
              <>
                {/*
                  Las filas de búsqueda nunca se filtran, así que la lista nunca
                  queda vacía y un `CommandEmpty` no se pintaría jamás. Que el
                  texto no nombra ninguna sección se dice aquí, a mano.
                */}
                {sinSeccion ? (
                  <p className="px-2.5 pb-1 pt-2 text-xs text-ink-soft">
                    Ninguna sección se llama así. Elige dónde buscarlo:
                  </p>
                ) : (
                  <CommandSeparator />
                )}
                <CommandGroup heading={`Buscar «${consulta}» en…`}>
                  {destinos.map((d) => (
                    <FilaBusqueda
                      key={d.href}
                      destino={d}
                      onElegir={() =>
                        ir(`${d.href}?q=${encodeURIComponent(consulta)}`)
                      }
                    />
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>

          {/*
            El pie dice cómo se maneja, solo donde hay teclado. En el teléfono
            sobra: se toca.
          */}
          <div className="hidden shrink-0 items-center gap-4 border-t border-hairline px-4 py-2 text-[11px] text-ink-soft sm:flex">
            <span><CommandShortcut className="ml-0 mr-1">↑↓</CommandShortcut>recorrer</span>
            <span><CommandShortcut className="ml-0 mr-1">Intro</CommandShortcut>abrir</span>
            <span><CommandShortcut className="ml-0 mr-1">Esc</CommandShortcut>cerrar</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/** Una fila de «Buscar en…»: el destino y, debajo, qué recorre. */
function FilaBusqueda({
  destino,
  onElegir,
}: {
  destino: DestinoBusqueda;
  onElegir: () => void;
}) {
  const seccion = SECCIONES.find((s) => s.id === destino.seccion);
  return (
    <CommandItem value={`buscar:${destino.href}`} onSelect={onElegir} className="items-start">
      <span
        aria-hidden
        className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", seccion?.hue.punto ?? "bg-ink")}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{destino.etiqueta}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
          {destino.alcance}
        </span>
      </span>
      <IconArrowRight className="mt-0.5 h-4 w-4 text-ink-soft" />
    </CommandItem>
  );
}

/** ¿Aparecen todas las palabras de lo tecleado, sin tildes ni mayúsculas? */
function coincide(busqueda: string, textos: string[]) {
  const heno = normalizar(textos.join(" "));
  return normalizar(busqueda)
    .split(/\s+/)
    .filter(Boolean)
    .every((palabra) => heno.includes(palabra));
}

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
