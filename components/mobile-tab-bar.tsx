"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SECCIONES, seccionDe, type Seccion } from "@/lib/secciones";
import {
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconCoins,
  IconDoc,
  IconGrid,
  IconLayers,
  IconMenu,
  IconTrendingUp,
} from "./icons";
import { cn } from "@/lib/cn";
import type { SeccionId } from "@/lib/secciones";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Navegación inferior móvil (oculta en lg+, donde navega el nav del header).
 *
 * Mismo modelo mental que el nav global: panorama + verticales, derivadas de
 * `lib/secciones`. Las vistas internas de cada vertical viven en la barra de
 * sección, no aquí: la tab bar cambia de vertical, no de vista.
 *
 * **Por qué cinco casillas y no siete.** Con el panorama y las seis verticales
 * la fila medía 504 px contra los 390 px de un iPhone, así que se dejó
 * deslizable — y el precio era el peor posible: en `/democracia` la pestaña
 * activa quedaba a 432 px, fuera de pantalla, o sea que la barra dejaba de
 * responder «¿dónde estoy?», que es lo único que tiene que hacer. Medido a
 * 390 px, siete casillas dan 55 px cada una y «Licitaciones» necesita 68 px:
 * no caben con dignidad. Cinco dan 78 px, que sí sostienen la etiqueta entera
 * a 11 px sin recortes ni desplazamiento lateral.
 *
 * Las cuatro verticales que quedan fijas son las que la plataforma nombra en
 * su propia descripción —qué compra, qué legisla y a quién paga— más el
 * panorama; las demás viven en la hoja de «Más», que se compone también desde
 * `lib/secciones` para que no haya dos listas que mantener. Cuando el
 * visitante está en una de ellas, la casilla de «Más» lleva su nombre y su
 * matiz: la barra sigue diciendo dónde está, sin mentir sobre qué abre.
 */

const ICONOS: Record<SeccionId, (p: { className?: string }) => React.ReactElement> = {
  licitaciones: IconCoins,
  finanzas: IconTrendingUp,
  congreso: IconLayers,
  normativa: IconDoc,
  nomina: IconChartBar,
  democracia: IconCheck,
};

/** Las que ocupan casilla fija, en orden. El resto va a la hoja. */
const FIJAS: SeccionId[] = ["licitaciones", "congreso", "nomina"];

export default function MobileTabBar() {
  const pathname = usePathname();
  const actual = seccionDe(pathname);
  const [hojaAbierta, setHojaAbierta] = useState(false);

  const fijas = FIJAS.map(
    (id) => SECCIONES.find((s) => s.id === id)!,
  ).filter(Boolean);
  const restantes = SECCIONES.filter((s) => !FIJAS.includes(s.id));

  const enHoja = restantes.find((s) => s.id === actual?.id) ?? null;

  const tabs = [
    {
      href: "/",
      label: "Panorama",
      Icon: IconGrid,
      activa: pathname === "/",
      barra: "bg-ink",
      texto: "text-ink",
    },
    ...fijas.map((s) => ({
      href: s.href,
      label: s.nombre,
      Icon: ICONOS[s.id],
      activa: actual?.id === s.id,
      barra: s.hue.barra,
      texto: s.hue.activo,
    })),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <div className="flex">
        {tabs.map(({ href, label, Icon, activa, barra, texto }) => (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 pb-1.5 pt-2 text-[11px] font-medium leading-tight transition-colors active:scale-95",
              activa ? texto : "text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 transition-opacity",
                barra,
                activa ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className="h-6 w-6" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}

        <Sheet open={hojaAbierta} onOpenChange={setHojaAbierta}>
          <SheetTrigger
            // `aria-current` va también aquí: cuando el visitante está en una
            // sección de la hoja, esta casilla **es** la que representa la
            // página actual en la navegación, y quien no ve el matiz tiene
            // derecho a saberlo igual.
            aria-current={enHoja ? "page" : undefined}
            aria-label={
              enHoja
                ? `${enHoja.nombre} — ver las demás secciones`
                : "Ver las demás secciones"
            }
            className={cn(
              "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 pb-1.5 pt-2 text-[11px] font-medium leading-tight transition-colors active:scale-95",
              enHoja ? enHoja.hue.activo : "text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 transition-opacity",
                enHoja ? enHoja.hue.barra : "bg-ink",
                enHoja ? "opacity-100" : "opacity-0",
              )}
            />
            <IconMenu className="h-6 w-6" />
            <span className="max-w-full truncate">{enHoja?.nombre ?? "Más"}</span>
          </SheetTrigger>

          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Las demás secciones</SheetTitle>
              <SheetDescription>
                Lo que la barra no lleva fijo. Cada una lee su propia fuente del
                Estado.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="px-2 py-2">
              <ul>
                {restantes.map((seccion) => (
                  <li key={seccion.id}>
                    <EnlaceHoja
                      seccion={seccion}
                      activa={actual?.id === seccion.id}
                      onNavegar={() => setHojaAbierta(false)}
                    />
                  </li>
                ))}
              </ul>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

/** Una fila de la hoja: objetivo táctil de 56 px, con el matiz de su vertical. */
function EnlaceHoja({
  seccion,
  activa,
  onNavegar,
}: {
  seccion: Seccion;
  activa: boolean;
  onNavegar: () => void;
}) {
  const Icon = ICONOS[seccion.id];
  return (
    <Link
      href={seccion.href}
      onClick={onNavegar}
      aria-current={activa ? "page" : undefined}
      className={cn(
        // La fila actual va rellena y con filete; las demás solo se encienden
        // al tocarlas, y con un papel más leve para que no se confundan con
        // ella.
        "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        activa
          ? "bg-canvas ring-1 ring-inset ring-hairline"
          : "hover:bg-canvas/70 active:bg-canvas/70",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          seccion.hue.chip,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-semibold",
            activa ? seccion.hue.activo : "text-ink",
          )}
        >
          {seccion.nombre}
        </span>
        <span className="block truncate text-xs text-ink-soft">
          {seccion.descriptor}
        </span>
      </span>
      <IconChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
    </Link>
  );
}
